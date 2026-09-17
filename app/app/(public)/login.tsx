import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <Screen inShell>
      <Text className="text-2xl font-semibold text-ink">Войти</Text>
      <Text className="mt-1 text-muted">Выберите, кем вы заходите. Это отдельные кабинеты.</Text>

      <View className="mt-6 gap-4">
        <Pressable
          onPress={() => router.push('/')}
          className="rounded-3xl border border-line bg-paper p-5"
        >
          <Text className="text-lg font-semibold text-ink">Пользователь</Text>
          <Text className="mt-2 text-sm leading-5 text-muted">
            Пароль не нужен: откройте событие, оставьте заявку и сохраните ссылку.
          </Text>
          <Text className="mt-4 text-sm font-medium text-clay">К событиям →</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/admin/login')}
          className="rounded-3xl border border-line bg-paper p-5"
        >
          <Text className="text-lg font-semibold text-ink">Админ</Text>
          <Text className="mt-2 text-sm leading-5 text-muted">
            Вход организатора: события, заявки людей, статусы.
          </Text>
          <Text className="mt-4 text-sm font-medium text-forest">Войти в админку →</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
