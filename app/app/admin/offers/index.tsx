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
  const [history, setHistory] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api
        .adminOffers({ archived: history })
        .then(setOffers)
        .catch((err: unknown) => {
          setError(err instanceof ApiError ? err.message : 'Не загрузились события');
        });
    }, [history]),
  );

  return (
    <Screen wide inShell>
      <View className="mb-6 flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-2xl font-semibold text-ink">События</Text>
          <Text className="mt-1 text-muted">
            {history
              ? 'Снятые события. Покупателей ищите в Людях — История и поиск по ФИО.'
              : 'Черновик на сайте не виден. Чтобы почистить событие: отметьте людей выполненными и снимите его в историю.'}
          </Text>
        </View>
        <Link href="/admin/offers/new" asChild>
          <Pressable className="rounded-2xl bg-clay px-4 py-3">
            <Text className="font-semibold text-white">Новое событие</Text>
          </Pressable>
        </Link>
      </View>

      <View className="mb-5 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => setHistory(false)}
          className={`rounded-full px-3 py-1.5 ${!history ? 'bg-forest' : 'border border-line bg-paper'}`}
        >
          <Text className={`text-xs ${!history ? 'text-white' : 'text-ink'}`}>Сейчас</Text>
        </Pressable>
        <Pressable
          onPress={() => setHistory(true)}
          className={`rounded-full px-3 py-1.5 ${history ? 'bg-forest' : 'border border-line bg-paper'}`}
        >
          <Text className={`text-xs ${history ? 'text-white' : 'text-ink'}`}>История</Text>
        </Pressable>
      </View>

      {error ? <ErrorState text={error} /> : null}

      {offers.length === 0 && !error ? (
        <EmptyState
          title={history ? 'История пустая' : 'Событий ещё нет'}
          text={
            history
              ? 'Когда снимете событие после выполнения заявок, оно появится здесь.'
              : 'Создайте первое: название, цена, лимит и поля, которые должен заполнить человек.'
          }
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
                      offer.published ? 'bg-forest-soft text-forest' : 'bg-cream text-muted'
                    }`}
                  >
                    {offer.published ? 'На сайте' : history ? 'История' : 'Черновик'}
                  </Text>
                </View>
                <Text className="mt-2 text-muted">
                  {formatPrice(offer.price)} · {remainingLabel(offer.remaining, offer.limit)} · полей:{' '}
                  {offer.fields.length}
                </Text>
                <Text className="mt-3 text-sm font-medium text-clay">Открыть и править →</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </Screen>
  );
}
