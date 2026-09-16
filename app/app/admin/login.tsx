import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Field, FieldGroup } from '../../src/components/Field';
import { Screen } from '../../src/components/Screen';
import { ErrorState } from '../../src/components/States';
import { api, ApiError } from '../../src/lib/api';
import { setAdminToken } from '../../src/lib/auth';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@sbor.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.login(email.trim(), password);
      await setAdminToken(result.token);
      router.replace('/admin/people');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text className="text-3xl font-semibold text-ink">Админка</Text>
      <Text className="mt-2 mb-6 text-base text-muted">
        Локальный вход: admin@sbor.local / admin123. Смените пароль в .env перед любой реальной работой.
      </Text>
      <View className="mb-6">
        <FieldGroup>
          <Field
            label="Почта"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </FieldGroup>
      </View>
      {error ? <ErrorState text={error} /> : null}
      <Button title="Войти" onPress={submit} loading={loading} />
    </Screen>
  );
}
