import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '../../../src/components/Screen';
import { EmptyState, ErrorState } from '../../../src/components/States';
import { api, ApiError } from '../../../src/lib/api';
import { formatPrice, remainingLabel } from '../../../src/lib/format';
import { Offer } from '../../../src/lib/types';

export default function AdminOffersScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      api
        .adminOffers()
        .then(setOffers)
        .catch((err: unknown) => {
          setError(err instanceof ApiError ? err.message : 'Не загрузились офферы');
        });
    }, []),
  );

  return (
    <Screen wide>
      <View className="mb-6 flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-2xl font-semibold text-ink">Офферы</Text>
          <Text className="mt-1 text-muted">Черновики не видны на сайте, пока не нажмёте «опубликовать».</Text>
        </View>
        <Link href="/admin/offers/new" asChild>
          <Pressable className="rounded-2xl bg-clay px-4 py-3">
            <Text className="font-semibold text-white">Новый оффер</Text>
          </Pressable>
        </Link>
      </View>

      {error ? <ErrorState text={error} /> : null}

      {offers.length === 0 && !error ? (
        <EmptyState
          title="Офферов ещё нет"
          text="Создайте первое событие: название, цена, лимит и поля, которые должен заполнить человек."
        />
      ) : (
        <View className="gap-3">
          {offers.map((offer) => (
            <Link key={offer.id} href={`/admin/offers/${offer.id}`} asChild>
              <Pressable className="rounded-3xl border border-line bg-paper p-5">
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="flex-1 text-lg font-semibold text-ink">{offer.title}</Text>
                  <Text
                    className={`rounded-full px-3 py-1 text-xs ${
                      offer.published ? 'bg-[#DCEBE4] text-forest' : 'bg-cream text-muted'
                    }`}
                  >
                    {offer.published ? 'На сайте' : 'Черновик'}
                  </Text>
                </View>
                <Text className="mt-2 text-muted">
                  {formatPrice(offer.price)} · {remainingLabel(offer.remaining, offer.limit)} · полей:{' '}
                  {offer.fields.length}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </Screen>
  );
}
