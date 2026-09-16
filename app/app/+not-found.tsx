import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen>
        <Text className="text-2xl font-semibold text-ink">Страница не найдена</Text>
        <Text className="mt-2 text-base text-muted">
          Проверьте ссылку или вернитесь к списку событий.
        </Text>
        <Link href="/" className="mt-6">
          <Text className="text-base font-medium text-clay">На главную</Text>
        </Link>
      </Screen>
    </>
  );
}
