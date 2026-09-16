import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { BrandHeader } from '../src/components/BrandHeader';
import { Button } from '../src/components/Button';
import { Screen } from '../src/components/Screen';

export default function SuccessScreen() {
  const router = useRouter();
  const { token, code } = useLocalSearchParams<{ token?: string; code?: string }>();
  const [copied, setCopied] = useState(false);
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://127.0.0.1:43127';
  const url = token ? `${origin}/b/${token}` : '';

  async function copy() {
    if (!url) return;
    await Clipboard.setStringAsync(url);
    setCopied(true);
  }

  return (
    <Screen>
      <BrandHeader subtitle="Заявка принята. Сохраните ссылку — по ней можно отменить или попросить возврат." />
      <View className="rounded-3xl border border-line bg-paper p-5">
        <Text className="text-sm uppercase tracking-wide text-muted">Код заявки</Text>
        <Text className="mt-1 text-3xl font-semibold text-ink">{code ?? '—'}</Text>
        <Text className="mt-4 text-base leading-6 text-muted">
          Если указали почту, то же письмо ушло туда. На локальной разработке письмо пишется в лог API.
        </Text>
        {url ? (
          <Text className="mt-4 text-sm text-forest" selectable>
            {url}
          </Text>
        ) : null}
        <View className="mt-6 gap-3">
          <Button title={copied ? 'Ссылка скопирована' : 'Скопировать ссылку'} onPress={copy} />
          {token ? (
            <Button
              title="Открыть заявку"
              variant="secondary"
              onPress={() => router.push(`/b/${token}`)}
            />
          ) : null}
          <Button title="На главную" variant="ghost" onPress={() => router.push('/')} />
        </View>
      </View>
    </Screen>
  );
}
