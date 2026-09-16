import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { BrandHeader } from '../../src/components/BrandHeader';
import { Button } from '../../src/components/Button';
import { DynamicFields } from '../../src/components/DynamicFields';
import { Field, FieldGroup } from '../../src/components/Field';
import { Screen } from '../../src/components/Screen';
import { EmptyState, ErrorState } from '../../src/components/States';
import { api, ApiError } from '../../src/lib/api';
import { formatPrice, remainingLabel } from '../../src/lib/format';
import { Offer } from '../../src/lib/types';

export default function OfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!id) return;
    api
      .offer(id)
      .then((data) => {
        setOffer(data);
        const initial: Record<string, unknown> = {};
        for (const field of data.fields) {
          initial[field.id] = field.type === 'checkbox' ? false : '';
        }
        setAnswers(initial);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Оффер не найден');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const soldOut = (offer?.remaining ?? 0) <= 0;

  async function submit() {
    if (!offer) return;
    setSubmitting(true);
    setError(null);
    try {
      const qty = Math.max(1, Number(quantity) || 1);
      const booking = await api.createBooking(offer.id, {
        name,
        phone,
        email: email.trim() || undefined,
        quantity: qty,
        answers,
      });
      router.push({
        pathname: '/success',
        params: { token: booking.token, code: booking.code },
      });
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Заявку не удалось отправить');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <BrandHeader subtitle="Заполните данные — ссылка на заявку останется у вас" />

      {loading ? (
        <Text className="text-muted">Открываем карточку…</Text>
      ) : !offer ? (
        <ErrorState title="Нет такого события" text={error ?? 'Возможно, его уже сняли с публикации.'} />
      ) : (
        <View className="gap-6">
          <View className="rounded-3xl bg-forest px-5 py-6">
            <Text className="text-2xl font-semibold text-white">{offer.title}</Text>
            <Text className="mt-2 text-lg text-[#DCEBE4]">{formatPrice(offer.price)}</Text>
            <Text className="mt-1 text-sm text-[#DCEBE4]">
              {remainingLabel(offer.remaining, offer.limit)}
            </Text>
          </View>

          <Text className="text-base leading-6 text-muted">
            Оплату пока подтверждаем вручную. После заявки с вами свяжутся. Ссылку на заявку
            покажем сразу — и отправим письмом, если укажете почту.
          </Text>

          {soldOut ? (
            <EmptyState
              title="Мест нет"
              text="Лимит по этому офферу выбран. Вернитесь в каталог и посмотрите, что ещё открыто."
            />
          ) : (
            <FieldGroup>
              <Field label="Имя *" value={name} onChangeText={setName} autoComplete="name" />
              <Field
                label="Телефон *"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+7 …"
              />
              <Field
                label="Почта"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                hint="Необязательно. Если укажете — пришлём ссылку на заявку."
              />
              <Field
                label="Количество мест / штук *"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
              />
              <DynamicFields
                fields={offer.fields}
                values={answers}
                onChange={(fieldId, value) =>
                  setAnswers((current) => ({ ...current, [fieldId]: value }))
                }
              />
            </FieldGroup>
          )}

          {error && offer ? <ErrorState text={error} /> : null}

          {!soldOut ? (
            <Button title="Отправить заявку" onPress={submit} loading={submitting} disabled={!name || !phone} />
          ) : (
            <Button title="К каталогу" variant="secondary" onPress={() => router.push('/')} />
          )}
        </View>
      )}
    </Screen>
  );
}
