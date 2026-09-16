import { Link, Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearAdminToken, getAdminToken } from '../../src/lib/auth';
import { api } from '../../src/lib/api';

export default function AdminLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname.endsWith('/login');
  const [ready, setReady] = useState(isLogin);
  const [authed, setAuthed] = useState(isLogin);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      setAuthed(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const token = await getAdminToken();
      if (!token) {
        if (!cancelled) {
          setAuthed(false);
          setReady(true);
        }
        return;
      }
      try {
        await api.me();
        if (!cancelled) setAuthed(true);
      } catch {
        await clearAdminToken();
        if (!cancelled) setAuthed(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLogin, pathname]);

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 bg-cream px-5 py-6">
        <Text className="text-muted">Проверяем вход…</Text>
      </SafeAreaView>
    );
  }

  if (!isLogin && !authed) {
    return <Redirect href="/admin/login" />;
  }

  if (isLogin) {
    return <Slot />;
  }

  async function logout() {
    await clearAdminToken();
    router.replace('/admin/login');
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="border-b border-line bg-paper">
        <View className="flex-row items-center justify-between px-5 py-3">
          <Link href="/">
            <Text className="text-xl font-semibold text-ink">Сбор</Text>
          </Link>
          <View className="flex-row items-center gap-4">
            <Nav href="/admin/offers" label="Офферы" active={pathname.includes('/offers')} />
            <Nav href="/admin/people" label="Люди" active={pathname.includes('/people')} />
            <Pressable onPress={logout}>
              <Text className="text-sm text-muted">Выйти</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
      <Slot />
    </View>
  );
}

function Nav({ href, label, active }: { href: '/admin/offers' | '/admin/people'; label: string; active: boolean }) {
  return (
    <Link href={href}>
      <Text className={`text-sm ${active ? 'font-semibold text-forest' : 'text-muted'}`}>{label}</Text>
    </Link>
  );
}
