import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '../../../src/components/Button';
import { Field } from '../../../src/components/Field';
import { Screen } from '../../../src/components/Screen';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { ErrorState } from '../../../src/components/States';
import { api, ApiError } from '../../../src/lib/api';
import { formatAnswer, formatDate, formatPrice } from '../../../src/lib/format';
import { Booking, BookingStatus, STATUS_LABEL } from '../../../src/lib/types';

const STATUSES: BookingStatus[] = [
  'new',
  'confirmed',
  'refund_requested',
  'done',
  'cancelled',
];

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .adminBooking(id)
      .then(setBooking)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Заявка не найдена');
      });
  }, [id]);

  async function setStatus(status: BookingStatus) {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      setBooking(await api.updateBookingStatus(id, status));
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Статус не обновился');
    } finally {
      setBusy(false);
    }
  }

  async function addComment() {
    if (!id || !comment.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setBooking(await api.addComment(id, comment.trim()));
      setComment('');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Комментарий не записался');
    } finally {
      setBusy(false);
    }
  }

  async function saveComment() {
    if (!id || !editingId || !editingBody.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setBooking(await api.updateComment(id, editingId, editingBody.trim()));
      setEditingId(null);
      setEditingBody('');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить заметку');
    } finally {
      setBusy(false);
    }
  }

  async function removeComment(commentId: string) {
    if (!id) return;
    const ok =
      typeof window !== 'undefined' ? window.confirm('Удалить заметку?') : true;
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      setBooking(await api.deleteComment(id, commentId));
      if (editingId === commentId) {
        setEditingId(null);
        setEditingBody('');
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Не удалось удалить заметку');
    } finally {
      setBusy(false);
    }
  }

  if (!booking && error) {
    return (
      <Screen inShell>
        <ErrorState text={error} />
      </Screen>
    );
  }

  if (!booking) {
    return (
      <Screen inShell>
        <Text className="text-muted">Открываем карточку…</Text>
      </Screen>
    );
  }

  return (
    <Screen inShell>
      <StatusBadge status={booking.status} />
      <Text className="mt-3 text-2xl font-semibold text-ink">{booking.name}</Text>
      <Link href={`/admin/offers/${booking.offer.id}`}>
        <Text className="mt-1 text-base text-forest">
          {booking.offer.title} · править событие
        </Text>
      </Link>
      <Text className="mt-1 text-muted">{booking.code}</Text>
      <Text className="mt-1 text-sm text-muted">{formatDate(booking.createdAt)}</Text>

      <View className="mt-6 rounded-3xl border border-line bg-paper p-5">
        <Row label="Телефон" value={booking.phone} />
        <Row label="Почта" value={booking.email ?? '—'} />
        <Row label="Количество" value={String(booking.quantity)} />
        <Row label="Сумма по прайсу" value={formatPrice(booking.offer.price * booking.quantity)} />
        {booking.offer.fields.map((field) => (
          <Row
            key={field.id}
            label={field.label}
            value={formatAnswer(booking.answers[field.id])}
          />
        ))}
      </View>

      <Text className="mt-6 text-sm font-medium text-ink">Статус</Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {STATUSES.map((status) => (
          <Button
            key={status}
            title={STATUS_LABEL[status]}
            variant={booking.status === status ? 'secondary' : 'ghost'}
            disabled={busy}
            onPress={() => setStatus(status)}
          />
        ))}
      </View>

      <Text className="mt-8 text-lg font-semibold text-ink">Заметки</Text>
      {(booking.comments ?? []).length === 0 ? (
        <Text className="mt-2 text-muted">Пока пусто — запишите, кто звонил и что решили.</Text>
      ) : (
        <View className="mt-3 gap-2">
          {(booking.comments ?? []).map((item) => (
            <View key={item.id} className="rounded-2xl border border-line bg-paper px-4 py-3">
              <Text className="text-xs text-muted">{formatDate(item.createdAt)}</Text>
              {editingId === item.id ? (
                <View className="mt-2 gap-2">
                  <Field
                    label="Текст заметки"
                    value={editingBody}
                    onChangeText={setEditingBody}
                    multiline
                  />
                  <View className="flex-row flex-wrap gap-2">
                    <Button title="Сохранить" variant="secondary" onPress={saveComment} loading={busy} />
                    <Button
                      title="Отмена"
                      variant="ghost"
                      onPress={() => {
                        setEditingId(null);
                        setEditingBody('');
                      }}
                    />
                  </View>
                </View>
              ) : (
                <>
                  <Text className="mt-1 text-base text-ink">{item.body}</Text>
                  <View className="mt-2 flex-row gap-3">
                    <Pressable
                      onPress={() => {
                        setEditingId(item.id);
                        setEditingBody(item.body);
                      }}
                    >
                      <Text className="text-sm text-forest">Изменить</Text>
                    </Pressable>
                    <Pressable onPress={() => removeComment(item.id)}>
                      <Text className="text-sm text-danger">Удалить</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ))}
        </View>
      )}

      <View className="mt-4 gap-3">
        <Field
          label="Новый комментарий"
          value={comment}
          onChangeText={setComment}
          multiline
          placeholder="Перевела на карту, ждём подтверждение"
        />
        <Button title="Добавить заметку" variant="secondary" onPress={addComment} loading={busy} />
      </View>

      {error ? (
        <View className="mt-4">
          <ErrorState text={error} />
        </View>
      ) : null}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-3 border-t border-line pt-3 first:mt-0 first:border-0 first:pt-0">
      <Text className="text-xs uppercase tracking-wide text-muted">{label}</Text>
      <Text className="mt-1 text-base text-ink" selectable>
        {value}
      </Text>
    </View>
  );
}
