import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { api } from '../../src/lib/api';
import { clearAdminToken, getAdminToken } from '../../src/lib/auth';
import { AppShell } from '../../src/shell/AppShell';
import { ADMIN_NAV } from '../../src/shell/nav';

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
    <AppShell
      brand="Админ"
      homeHref="/admin"
      items={ADMIN_NAV}
      pathname={pathname}
      footer={
        <View className="flex-row items-center gap-4">
          <ThemeToggle />
          <Pressable onPress={logout}>
            <Text className="text-sm text-muted">Выйти</Text>
          </Pressable>
        </View>
      }
    />
  );
}
