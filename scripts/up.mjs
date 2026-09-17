import { execSync, spawn } from 'node:child_process';
import { copyFileSync, existsSync, statSync } from 'node:fs';
import { createConnection } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = join(root, 'api');
const appDir = join(root, 'app');
const API_URL = 'http://127.0.0.1:43128';
const APP_URL = 'http://127.0.0.1:43127';
const API_PORT = 43128;
const APP_PORT = 43127;
const isWin = process.platform === 'win32';

function requireNode20() {
  const major = Number(process.versions.node.split('.')[0]);
  if (Number.isNaN(major) || major < 20) {
    console.error(`Нужен Node 20+. Сейчас: ${process.versions.node}`);
    process.exit(1);
  }
}

function run(command, cwd) {
  execSync(command, { cwd, env: process.env, stdio: 'inherit', shell: true });
}

function mtime(path) {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return 0;
  }
}

function needsInstall(dir) {
  const modules = join(dir, 'node_modules');
  if (!existsSync(modules)) return true;
  const installedAt = Math.max(mtime(modules), mtime(join(modules, '.package-lock.json')));
  return (
    mtime(join(dir, 'package-lock.json')) > installedAt ||
    mtime(join(dir, 'package.json')) > installedAt
  );
}

function ensureDeps(dir, label) {
  if (!needsInstall(dir)) {
    console.log(`→ ${label}: зависимости уже стоят`);
    return false;
  }
  console.log(`→ ${label}: npm install`);
  run('npm install', dir);
  return true;
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' });
    socket.setTimeout(400);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

async function healthOk() {
  try {
    const res = await fetch(`${API_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitFor(url, timeoutMs, label) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // still booting
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`${label} не поднялся за ${Math.round(timeoutMs / 1000)}с: ${url}`);
}

function lanIp() {
  for (const iface of ['en0', 'en1']) {
    try {
      const ip = execSync(`ipconfig getifaddr ${iface}`, {
        encoding: 'utf8',
      }).trim();
      if (ip) return ip;
    } catch {
      // try next interface
    }
  }
  return null;
}

function start(command, cwd, extraEnv = {}) {
  return spawn(command, {
    cwd,
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit',
    shell: true,
    detached: !isWin,
  });
}

function stop(child) {
  if (!child?.pid || child.exitCode != null) return;
  try {
    if (!isWin) process.kill(-child.pid, 'SIGTERM');
    else child.kill('SIGTERM');
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {
      // already gone
    }
  }
}

async function main() {
  requireNode20();

  const envFile = join(apiDir, '.env');
  if (!existsSync(envFile)) {
    copyFileSync(join(apiDir, '.env.example'), envFile);
    console.log('Создан api/.env из .env.example');
  }

  const apiInstalled = ensureDeps(apiDir, 'API');
  const prismaClient = join(apiDir, 'node_modules/.prisma/client');
  const schemaChanged =
    !existsSync(prismaClient) ||
    mtime(join(apiDir, 'prisma/schema.prisma')) > mtime(prismaClient);
  if (apiInstalled || schemaChanged) {
    run('npx prisma generate', apiDir);
  }
  if (apiInstalled) {
    try {
      run('npm rebuild bcrypt', apiDir);
    } catch {
      console.warn(
        'bcrypt rebuild пропущен — если API упадёт на bcrypt, запусти вручную: cd api && npm rebuild bcrypt',
      );
    }
  }
  run('npx prisma migrate deploy', apiDir);
  run('npx prisma db seed', apiDir);

  ensureDeps(appDir, 'Сайт');

  const children = [];
  const shutdown = (code = 0) => {
    for (const child of children) stop(child);
    process.exit(code);
  };
  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));

  if (await portOpen(API_PORT)) {
    if (!(await healthOk())) {
      console.error(`Порт ${API_PORT} занят, и это не API Сбора. Освободи порт и повтори.`);
      process.exit(1);
    }
    console.log(`\n→ API уже запущен: ${API_URL}`);
  } else {
    console.log('\n→ API');
    const api = start('npm run start:dev', apiDir);
    children.push(api);
    api.on('exit', (code) => {
      if (code) {
        console.error(`API завершился с кодом ${code}`);
        shutdown(code ?? 1);
      }
    });
    await waitFor(`${API_URL}/health`, 90_000, 'API');
  }

  const phoneIp = lanIp();
  const phoneApp = phoneIp ? `http://${phoneIp}:${APP_PORT}` : null;
  const phoneApi = phoneIp ? `http://${phoneIp}:${API_PORT}` : null;
  const appEnv = phoneApi ? { EXPO_PUBLIC_API_URL: phoneApi } : {};

  if (await portOpen(APP_PORT)) {
    console.log(`Сайт уже слушает ${APP_URL}`);
    console.log('Если это чужой процесс — останови его и снова npm start.');
    console.log('Expo не запускай из корня. Нужно: cd app && npm run web');
  } else {
    console.log('\n→ Сайт');
    const app = start('npm run web', appDir, appEnv);
    children.push(app);
    app.on('exit', (code) => {
      if (code) {
        console.error(`Сайт завершился с кодом ${code}`);
        shutdown(code ?? 1);
      }
    });
  }

  console.log(`
Готово
  сайт   ${APP_URL}
  API    ${API_URL}
  вход   ${APP_URL}/login
  админ  ${APP_URL}/admin/login

  admin@sbor.local / admin123
${
  phoneApp
    ? `
  iPhone, тот же Wi‑Fi, в Safari:
  ${phoneApp}

  Камерой айфона QR Expo не открывается (exp://) —
  будет «Пригодные данные не найдены».
  Либо введи адрес выше, либо сканируй QR внутри Expo Go.
`
    : ''
}
Ctrl+C останавливает оба процесса.
`);

  if (children.length === 0) {
    return;
  }

  await new Promise(() => {});
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
