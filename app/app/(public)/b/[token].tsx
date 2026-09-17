import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../../src/components/Button';
import { Screen } from '../../../src/components/Screen';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { ErrorState } from '../../../src/components/States';
import { api, ApiError } from '../../../src/lib/api';
import { formatAnswer, formatDate, formatPrice } from '../../../src/lib/format';
import { Booking } from '../../../src/lib/types';

export default function BookingScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'cancel' | 'refund' | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .booking(token)
      .then(setBooking)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Заявка не найдена');
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function cancel() {
    if (!token) return;
    setBusy('cancel');
    try {
      setBooking(await api.cancelBooking(token));
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Не удалось отменить');
    } finally {
      setBusy(null);
    }
  }

  async function refund() {
    if (!token) return;
    setBusy('refund');
    try {
      setBooking(await api.refundBooking(token));
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Не удалось запросить возврат');
    } finally {
      setBusy(null);
    }
  }

  const closed = booking?.status === 'cancelled' || booking?.status === 'done';

  return (
    <Screen inShell>
      <Text className="text-2xl font-semibold text-ink">Ваша заявка</Text>
      <Text className="mt-1 mb-6 text-muted">Ссылкой можно делиться только с собой.</Text>

      {loading ? (
        <Text className="text-muted">Ищем заявку…</Text>
      ) : !booking ? (
        <ErrorState
          title="Ссылка не сработала"
          text={error ?? 'Проверьте адрес или попросите новую ссылку у организатора.'}
        />
      ) : (
        <View className="gap-5">
          <View className="rounded-3xl border border-line bg-paper p-5">
            <StatusBadge status={booking.status} />
            <Text className="mt-3 text-2xl font-semibold text-ink">{booking.offer.title}</Text>
            <Text className="mt-1 text-muted">{booking.code}</Text>
            <Text className="mt-3 text-base text-ink">
              {formatPrice(booking.offer.price)} × {booking.quantity}
            </Text>
            <Text className="mt-1 text-sm text-muted">{formatDate(booking.createdAt)}</Text>
          </View>

          <View className="rounded-3xl border border-line bg-paper p-5">
            <Text className="text-lg font-semibold text-ink">Данные</Text>
            <Row label="ФИО" value={booking.name} />
            <Row label="Телефон" value={booking.phone} />
            <Row label="Почта" value={booking.email ?? '—'} />
            {booking.offer.fields.map((field) => (
              <Row
                key={field.id}
                label={field.label}
                value={formatAnswer(booking.answers[field.id])}
              />
            ))}
          </View>

          {error ? <ErrorState text={error} /> : null}

          {!closed ? (
            <View className="gap-3">
              <Button
                title="Отменить заявку"
                variant="ghost"
                loading={busy === 'cancel'}
                onPress={cancel}
              />
              <Button
                title="Запросить возврат"
                variant="danger"
                loading={busy === 'refund'}
                onPress={refund}
              />
              <Text className="text-sm leading-5 text-muted">
                Отмена освобождает место. Возврат — сигнал админу, что вы уже переводили деньги и
                ждёте их обратно. Оплату в MVP подтверждаем вручную.
              </Text>
            </View>
          ) : booking.status === 'done' ? (
            <Text className="text-base text-muted">Заявка выполнена. Если что-то не так — напишите организатору.</Text>
          ) : (
            <Text className="text-base text-muted">Заявка отменена, место снова в лимите.</Text>
          )}

          <Button title="К событиям" variant="ghost" onPress={() => router.push('/')} />
        </View>
      )}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-3 border-t border-line pt-3">
      <Text className="text-xs uppercase tracking-wide text-muted">{label}</Text>
      <Text className="mt-1 text-base text-ink">{value}</Text>
    </View>
  );
}
