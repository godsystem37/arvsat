import { Link, Stack, usePathname } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '../src/components/Screen';

export default function NotFound() {
  const pathname = usePathname();
  const inAdmin = pathname.startsWith('/admin');
  const href = inAdmin ? '/admin' : '/';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen inShell={false}>
        <Text className="text-2xl font-semibold text-ink">Страница не найдена</Text>
        <Text className="mt-2 text-base text-muted">
          {inAdmin
            ? 'Такого раздела в админке нет. Вернитесь к событиям и людям.'
            : 'Проверьте ссылку или вернитесь к списку событий.'}
        </Text>
        <Link href={href} className="mt-6">
          <Text className="text-base font-medium text-clay">
            {inAdmin ? 'В админку' : 'К событиям'}
          </Text>
        </Link>
      </Screen>
    </>
  );
}
