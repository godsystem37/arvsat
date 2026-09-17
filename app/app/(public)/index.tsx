import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { EmptyState, ErrorState } from '../../src/components/States';
import { Screen } from '../../src/components/Screen';
import { api, ApiError } from '../../src/lib/api';
import { formatPrice, remainingLabel } from '../../src/lib/format';
import { Offer } from '../../src/lib/types';

export default function CatalogScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .offers()
      .then((data) => {
        setOffers(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Каталог не загрузился');
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen inShell>
      <Text className="text-2xl font-semibold text-ink">События</Text>
      <Text className="mt-1 text-muted">Выберите поездку или товар и оставьте заявку.</Text>

      {loading ? (
        <Text className="mt-6 text-muted">Загружаем открытые события…</Text>
      ) : error ? (
        <View className="mt-6">
          <ErrorState text={error} />
        </View>
      ) : offers.length === 0 ? (
        <View className="mt-6">
          <EmptyState
            title="Пока тишина"
            text="Пока нет опубликованных событий. Когда появится поездка или товар — они будут в этом списке."
          />
        </View>
      ) : (
        <View className="mt-6 gap-4">
          {offers.map((offer) => (
            <Link key={offer.id} href={`/offers/${offer.id}`} asChild>
              <Pressable className="rounded-3xl border border-line bg-paper p-5">
                <Text className="text-xl font-semibold text-ink">{offer.title}</Text>
                <Text className="mt-2 text-lg text-forest">{formatPrice(offer.price)}</Text>
                <Text className="mt-1 text-sm text-muted">
                  {remainingLabel(offer.remaining, offer.limit)}
                </Text>
                <Text className="mt-4 text-sm font-medium text-clay">Оставить заявку →</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </Screen>
  );
}
