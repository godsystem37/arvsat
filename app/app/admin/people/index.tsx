import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '../../../src/components/Button';
import { Screen } from '../../../src/components/Screen';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { EmptyState, ErrorState } from '../../../src/components/States';
import { api, ApiError } from '../../../src/lib/api';
import { formatDate } from '../../../src/lib/format';
import { Booking, BookingStatus, Offer, STATUS_LABEL } from '../../../src/lib/types';
import { useTheme } from '../../../src/theme/ThemeProvider';

const STATUSES: Array<BookingStatus | ''> = [
  '',
  'new',
  'confirmed',
  'refund_requested',
  'done',
  'cancelled',
];

type Scope = 'live' | 'history';

export default function PeopleScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ offerId?: string; scope?: string }>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerId, setOfferId] = useState(params.offerId ?? '');
  const [scope, setScope] = useState<Scope>(params.scope === 'history' ? 'history' : 'live');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api.adminBookings({
        offerId: offerId || undefined,
        status: status || undefined,
        q: q.trim() || undefined,
        scope: status || q.trim() ? undefined : scope,
      }),
      api.adminOffers({ archived: 'all' }),
    ])
      .then(([people, offerList]) => {
        setBookings(people);
        setOffers(offerList);
        setSelected({});
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Не загрузился список');
      });
  }, [offerId, status, q, scope]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, on]) => on).map(([id]) => id),
    [selected],
  );
  const allSelected = bookings.length > 0 && selectedIds.length === bookings.length;

  function pickOffer(id: string) {
    setOfferId(id);
    router.setParams({ offerId: id || undefined });
  }

  function pickScope(next: Scope) {
    setScope(next);
    setStatus('');
    router.setParams({ scope: next });
  }

  function toggle(id: string) {
    setSelected((current) => ({ ...current, [id]: !current[id] }));
  }

  function toggleAll() {
    if (allSelected) {
      setSelected({});
      return;
    }
    setSelected(Object.fromEntries(bookings.map((booking) => [booking.id, true])));
  }

  async function markDone() {
    if (selectedIds.length === 0) return;
    const ok =
      typeof window !== 'undefined'
        ? window.confirm(
            `Отметить ${selectedIds.length} заявок как выполненные? Они уйдут в историю, покупателей потом найдёте поиском.`,
          )
        : true;
    if (!ok) return;
    setBusy(true);
    setError(null);
    setHint(null);
    try {
      await api.updateBookingsStatus(selectedIds, 'done');
      setHint(`Готово: ${selectedIds.length} в истории. Если живых заявок не осталось — снимите событие.`);
      load();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сменить статус');
    } finally {
      setBusy(false);
    }
  }

  async function archiveOffer() {
    if (!offerId) return;
    const ok =
      typeof window !== 'undefined'
        ? window.confirm(
            'Снять событие в историю? С сайта оно исчезнет. Людей найдёте здесь, во вкладке История и поиском.',
          )
        : true;
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await api.archiveOffer(offerId);
      setHint('Событие снято. Покупатели в истории, поиск по ФИО и телефону их найдёт.');
      load();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Не удалось снять событие');
    } finally {
      setBusy(false);
    }
  }

  const selectedOffer = offers.find((offer) => offer.id === offerId);

  return (
    <Screen wide inShell>
      <Text className="text-2xl font-semibold text-ink">Люди</Text>
      <Text className="mt-1 text-muted">
        Живые заявки здесь. Выполненных уводим в историю — поиск по ФИО и телефону их всё равно находит.
      </Text>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Поиск по ФИО, телефону, коду — ищет и в истории"
        placeholderTextColor={colors.muted}
        className="mt-5 h-12 rounded-2xl border border-line bg-paper px-4 text-base text-ink"
      />

      <View className="mt-3 flex-row flex-wrap gap-2">
        <Chip label="Сейчас" active={scope === 'live' && !status} onPress={() => pickScope('live')} />
        <Chip
          label="История"
          active={scope === 'history' && !status}
          onPress={() => pickScope('history')}
        />
      </View>

      <View className="mt-3 flex-row flex-wrap gap-2">
        <Chip label="Все события" active={!offerId} onPress={() => pickOffer('')} />
        {offers.map((offer) => (
          <Chip
            key={offer.id}
            label={offer.archived ? `${offer.title} · история` : offer.title}
            active={offerId === offer.id}
            onPress={() => pickOffer(offer.id)}
          />
        ))}
      </View>

      <View className="mt-2 flex-row flex-wrap gap-2">
        {STATUSES.map((item) => (
          <Chip
            key={item || 'all'}
            label={item ? STATUS_LABEL[item] : 'Все статусы'}
            active={status === item}
            onPress={() => setStatus(item)}
          />
        ))}
      </View>

      <View className="mt-4 flex-row flex-wrap items-center gap-2">
        <Pressable
          onPress={toggleAll}
          disabled={bookings.length === 0}
          className={`rounded-2xl border px-4 py-2.5 ${
            allSelected ? 'border-forest bg-forest-soft' : 'border-line bg-paper'
          }`}
        >
          <Text className="text-sm text-ink">
            {allSelected ? 'Снять выбор' : 'Выбрать всех'}
          </Text>
        </Pressable>
        <View className="min-w-[160px] flex-1">
          <Button
            title={
              selectedIds.length ? `Выполнено · ${selectedIds.length}` : 'Выполнено'
            }
            onPress={markDone}
            loading={busy}
            disabled={selectedIds.length === 0}
          />
        </View>
        {offerId && selectedOffer && !selectedOffer.archived ? (
          <View className="min-w-[160px] flex-1">
            <Button
              title="Снять событие"
              variant="ghost"
              onPress={archiveOffer}
              loading={busy}
            />
          </View>
        ) : null}
      </View>

      {hint ? <Text className="mt-3 text-sm text-forest">{hint}</Text> : null}
      {error ? (
        <View className="mt-4">
          <ErrorState text={error} />
        </View>
      ) : null}

      {bookings.length === 0 && !error ? (
        <View className="mt-6">
          <EmptyState
            title={scope === 'history' ? 'История пустая' : 'Живых заявок нет'}
            text={
              scope === 'history'
                ? 'Когда отметите людей выполненными, они появятся здесь. Поиск сверху находит их всегда.'
                : 'Как только кто-то заполнит форму, человек появится здесь.'
            }
          />
        </View>
      ) : (
        <View className="mt-6 gap-3">
          {bookings.map((booking) => {
            const on = Boolean(selected[booking.id]);
            const historic = booking.status === 'done' || booking.status === 'cancelled';
            return (
              <View
                key={booking.id}
                className={`flex-row items-stretch overflow-hidden rounded-3xl border bg-paper ${
                  on ? 'border-forest' : 'border-line'
                }`}
              >
                <Pressable
                  onPress={() => toggle(booking.id)}
                  className="w-14 items-center justify-center"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel="Выбрать заявку"
                >
                  <View
                    className={`h-5 w-5 items-center justify-center rounded ${
                      on ? 'bg-forest' : 'border border-line bg-cream'
                    }`}
                  >
                    {on ? <Text className="text-xs text-white">✓</Text> : null}
                  </View>
                </Pressable>
                <Link href={`/admin/people/${booking.id}`} asChild>
                  <Pressable className="flex-1 py-4 pr-4">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-ink">{booking.name}</Text>
                        <Text className="mt-1 text-sm text-muted">{booking.phone}</Text>
                      </View>
                      <StatusBadge status={booking.status} />
                    </View>
                    <Text className="mt-3 text-sm text-ink">{booking.offer.title}</Text>
                    <Text className="mt-1 text-xs text-muted">
                      {historic ? 'История · ' : ''}
                      {booking.code} · {booking.quantity} шт. · {formatDate(booking.createdAt)}
                    </Text>
                  </Pressable>
                </Link>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-3 py-1.5 ${active ? 'bg-forest' : 'bg-paper border border-line'}`}
    >
      <Text className={`text-xs ${active ? 'text-white' : 'text-ink'}`} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
