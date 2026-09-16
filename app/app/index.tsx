import { Link, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BrandHeader } from '../src/components/BrandHeader';
import { EmptyState, ErrorState } from '../src/components/States';
import { Screen } from '../src/components/Screen';
import { api, ApiError } from '../src/lib/api';
import { formatPrice, remainingLabel } from '../src/lib/format';
import { Offer } from '../src/lib/types';

export default function CatalogScreen() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .offers()
      .then((data) => {
        setOffers(data);
        setSelectedId(data[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Каталог не загрузился');
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(
    () => offers.find((offer) => offer.id === selectedId) ?? null,
    [offers, selectedId],
  );

  return (
    <Screen>
      <BrandHeader />

      <Text className="mb-2 text-sm font-medium uppercase tracking-wide text-muted">
        Событие
      </Text>

      {loading ? (
        <Text className="text-muted">Загружаем открытые офферы…</Text>
      ) : error ? (
        <ErrorState text={error} />
      ) : offers.length === 0 ? (
        <EmptyState
          title="Пока тишина"
          text="Админ ещё не опубликовал ни одного события. Когда появится поездка или товар — они будут в этом списке."
        />
      ) : (
        <View className="gap-3">
          <Pressable
            onPress={() => setOpen((value) => !value)}
            className="rounded-2xl border border-line bg-paper px-4 py-4"
          >
            <Text className="text-xs text-muted">Выберите событие</Text>
            <Text className="mt-1 text-lg font-medium text-ink">
              {selected?.title ?? 'Нет выбранного'}
            </Text>
            <Text className="mt-1 text-sm text-forest">{open ? 'Скрыть список' : 'Открыть список'}</Text>
          </Pressable>

          {open ? (
            <View className="overflow-hidden rounded-2xl border border-line bg-paper">
              {offers.map((offer, index) => (
                <Pressable
                  key={offer.id}
                  onPress={() => {
                    setSelectedId(offer.id);
                    setOpen(false);
                  }}
                  className={`px-4 py-3 ${index ? 'border-t border-line' : ''} ${
                    offer.id === selectedId ? 'bg-[#DCEBE4]' : ''
                  }`}
                >
                  <Text className="text-base font-medium text-ink">{offer.title}</Text>
                  <Text className="text-sm text-muted">
                    {formatPrice(offer.price)} · {remainingLabel(offer.remaining, offer.limit)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      )}

      <View className="mt-8 gap-4">
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

      {selected ? (
        <Pressable
          onPress={() => router.push(`/offers/${selected.id}`)}
          className="mt-8 min-h-[52px] items-center justify-center rounded-2xl bg-clay"
        >
          <Text className="text-base font-semibold text-white">
            Перейти к «{selected.title}»
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
