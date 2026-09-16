import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../src/components/Screen';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { EmptyState, ErrorState } from '../../../src/components/States';
import { api, ApiError } from '../../../src/lib/api';
import { formatDate } from '../../../src/lib/format';
import { Booking, BookingStatus, Offer, STATUS_LABEL } from '../../../src/lib/types';

const STATUSES: Array<BookingStatus | ''> = [
  '',
  'new',
  'confirmed',
  'refund_requested',
  'cancelled',
];

export default function PeopleScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerId, setOfferId] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api.adminBookings({
        offerId: offerId || undefined,
        status: status || undefined,
        q: q.trim() || undefined,
      }),
      api.adminOffers(),
    ])
      .then(([people, offerList]) => {
        setBookings(people);
        setOffers(offerList);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Не загрузился список');
      });
  }, [offerId, status, q]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen wide>
      <Text className="text-2xl font-semibold text-ink">Люди</Text>
      <Text className="mt-1 text-muted">
        Все заявки в одном месте: статус, телефон, что человек купил и что просил вернуть.
      </Text>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Поиск по имени, телефону, коду"
        placeholderTextColor="#8A8174"
        className="mt-5 h-12 rounded-2xl border border-line bg-paper px-4 text-base text-ink"
      />

      <View className="mt-3 flex-row flex-wrap gap-2">
        <Chip
          label="Все офферы"
          active={!offerId}
          onPress={() => setOfferId('')}
        />
        {offers.map((offer) => (
          <Chip
            key={offer.id}
            label={offer.title}
            active={offerId === offer.id}
            onPress={() => setOfferId(offer.id)}
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

      {error ? (
        <View className="mt-4">
          <ErrorState text={error} />
        </View>
      ) : null}

      {bookings.length === 0 && !error ? (
        <View className="mt-6">
          <EmptyState
            title="Заявок пока нет"
            text="Как только кто-то заполнит форму на сайте, человек появится здесь."
          />
        </View>
      ) : (
        <View className="mt-6 gap-3">
          {bookings.map((booking) => (
            <Link key={booking.id} href={`/admin/people/${booking.id}`} asChild>
              <Pressable className="rounded-3xl border border-line bg-paper p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-ink">{booking.name}</Text>
                    <Text className="mt-1 text-sm text-muted">{booking.phone}</Text>
                  </View>
                  <StatusBadge status={booking.status} />
                </View>
                <Text className="mt-3 text-sm text-ink">{booking.offer.title}</Text>
                <Text className="mt-1 text-xs text-muted">
                  {booking.code} · {booking.quantity} шт. · {formatDate(booking.createdAt)}
                </Text>
              </Pressable>
            </Link>
          ))}
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
