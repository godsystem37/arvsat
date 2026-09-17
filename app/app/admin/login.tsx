import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Field, FieldGroup } from '../../src/components/Field';
import { Screen } from '../../src/components/Screen';
import { ErrorState } from '../../src/components/States';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { api, ApiError } from '../../src/lib/api';
import { setAdminToken } from '../../src/lib/auth';
import { constrainInput, validateEmail } from '../../src/lib/validation';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@sbor.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function submit() {
    const mailErr = validateEmail(email, true);
    const passErr = password.trim() ? undefined : 'Введите пароль';
    setEmailError(mailErr ?? undefined);
    setPasswordError(passErr);
    if (mailErr || passErr) return;

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
      <View className="mb-6 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-3xl font-semibold text-ink">Админка</Text>
          <Text className="mt-2 text-base text-muted">Только для организатора. Публичный каталог сюда не ведёт.</Text>
        </View>
        <ThemeToggle />
      </View>
      <View className="mb-6">
        <FieldGroup>
          <Field
            label="Почта"
            value={email}
            onChangeText={(value) => setEmail(constrainInput('email', value))}
            autoCapitalize="none"
            keyboardType="email-address"
            error={emailError}
          />
          <Field
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={passwordError}
          />
        </FieldGroup>
      </View>
      {error ? <ErrorState text={error} /> : null}
      <Button title="Войти" onPress={submit} loading={loading} />
      <View className="mt-3">
        <Button title="Назад к выбору входа" variant="ghost" onPress={() => router.replace('/login')} />
      </View>
    </Screen>
  );
}
