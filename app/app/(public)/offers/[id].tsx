import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../../src/components/Button';
import { DynamicFields } from '../../../src/components/DynamicFields';
import { Field, FieldGroup } from '../../../src/components/Field';
import { Screen } from '../../../src/components/Screen';
import { EmptyState, ErrorState } from '../../../src/components/States';
import { api, ApiError } from '../../../src/lib/api';
import { formatPrice, remainingLabel } from '../../../src/lib/format';
import { Offer } from '../../../src/lib/types';
import {
  constrainInput,
  formatFio,
  toE164Ru,
  validateDate,
  validateEmail,
  validateFio,
  validateNumberValue,
  validatePhone,
  validateQuantity,
  validateText,
} from '../../../src/lib/validation';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  const errors = useMemo(() => {
    if (!offer) return {};
    const next: Record<string, string> = {};
    const nameErr = validateFio(name);
    if (nameErr) next.name = nameErr;
    const phoneErr = validatePhone(phone);
    if (phoneErr) next.phone = phoneErr;
    const emailErr = validateEmail(email);
    if (emailErr) next.email = emailErr;
    const qtyErr = validateQuantity(quantity, offer.remaining);
    if (qtyErr) next.quantity = qtyErr;
    for (const field of offer.fields) {
      const value = answers[field.id];
      let message: string | null = null;
      if (field.type === 'checkbox') continue;
      if (field.type === 'phone') message = validatePhone(String(value ?? ''), field.required);
      else if (field.type === 'email') message = validateEmail(String(value ?? ''), field.required);
      else if (field.type === 'date') message = validateDate(String(value ?? ''), field.required, field.label);
      else if (field.type === 'number') message = validateNumberValue(value, field.required, field.label);
      else if (field.type === 'select') {
        const text = String(value ?? '').trim();
        if (!text) message = field.required ? `Выберите «${field.label}»` : null;
        else if (field.options?.length && !field.options.includes(text)) {
          message = `Выберите вариант в «${field.label}»`;
        }
      } else {
        message = validateText(String(value ?? ''), {
          required: field.required,
          max: field.type === 'textarea' ? 2000 : 200,
          label: field.label,
        });
      }
      if (message) next[field.id] = message;
    }
    return next;
  }, [answers, email, name, offer, phone, quantity]);

  function showError(key: string) {
    return touched[key] || Boolean(fieldErrors[key]) ? errors[key] : undefined;
  }

  async function submit() {
    if (!offer) return;
    const keys = ['name', 'phone', 'email', 'quantity', ...offer.fields.map((field) => field.id)];
    setTouched(Object.fromEntries(keys.map((key) => [key, true])));
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const qty = Number(quantity);
      const booking = await api.createBooking(offer.id, {
        name: formatFio(name),
        phone: toE164Ru(phone) ?? phone,
        email: email.trim() || undefined,
        quantity: qty,
        answers: Object.fromEntries(
          offer.fields.map((field) => {
            const value = answers[field.id];
            if (field.type === 'phone') return [field.id, toE164Ru(String(value ?? '')) ?? value];
            if (field.type === 'number') return [field.id, value === '' ? null : Number(value)];
            return [field.id, value];
          }),
        ),
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
    <Screen inShell>
      <Text className="text-sm font-medium uppercase tracking-wide text-muted">Заявка</Text>
      <Text className="mt-1 text-muted">Ссылку на заявку покажем сразу после отправки.</Text>

      {loading ? (
        <Text className="mt-6 text-muted">Открываем карточку…</Text>
      ) : !offer ? (
        <View className="mt-6">
          <ErrorState title="Нет такого события" text={error ?? 'Возможно, его уже сняли с публикации.'} />
        </View>
      ) : (
        <View className="mt-6 gap-6">
          <View className="rounded-3xl bg-forest px-5 py-6">
            <Text className="text-2xl font-semibold text-white">{offer.title}</Text>
            <Text className="mt-2 text-lg text-white/80">{formatPrice(offer.price)}</Text>
            <Text className="mt-1 text-sm text-white/80">
              {remainingLabel(offer.remaining, offer.limit)}
            </Text>
          </View>

          {soldOut ? (
            <EmptyState
              title="Мест нет"
              text="Лимит по этому событию выбран. Вернитесь в каталог и посмотрите, что ещё открыто."
            />
          ) : (
            <FieldGroup>
              <Field
                label="ФИО *"
                value={name}
                onChangeText={(value) => setName(constrainInput('fio', value))}
                onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                autoComplete="name"
                autoCapitalize="words"
                placeholder="Иванов Иван Иванович"
                hint="Три слова с заглавной буквы: фамилия, имя, отчество"
                error={showError('name')}
              />
              <Field
                label="Телефон *"
                value={phone}
                onChangeText={(value) => setPhone(constrainInput('phone', value))}
                onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
                keyboardType="phone-pad"
                placeholder="+7 (999) 123-45-67"
                error={showError('phone')}
              />
              <Field
                label="Почта"
                value={email}
                onChangeText={(value) => setEmail(constrainInput('email', value))}
                onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                keyboardType="email-address"
                autoCapitalize="none"
                hint="Необязательно. Если укажете — пришлём ссылку на заявку."
                error={showError('email')}
              />
              <Field
                label="Количество мест / штук *"
                value={quantity}
                onChangeText={(value) => setQuantity(constrainInput('number', value))}
                onBlur={() => setTouched((current) => ({ ...current, quantity: true }))}
                keyboardType="number-pad"
                error={showError('quantity')}
              />
              <DynamicFields
                fields={offer.fields}
                values={answers}
                errors={Object.fromEntries(
                  offer.fields
                    .filter((field) => showError(field.id))
                    .map((field) => [field.id, errors[field.id]]),
                )}
                onChange={(fieldId, value) => {
                  setAnswers((current) => ({ ...current, [fieldId]: value }));
                  setTouched((current) => ({ ...current, [fieldId]: true }));
                }}
              />
            </FieldGroup>
          )}

          {error && offer ? <ErrorState text={error} /> : null}

          {!soldOut ? (
            <Button title="Отправить заявку" onPress={submit} loading={submitting} />
          ) : (
            <Button title="К каталогу" variant="secondary" onPress={() => router.push('/')} />
          )}
        </View>
      )}
    </Screen>
  );
}
