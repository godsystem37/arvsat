import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { constrainInput, validateMoney, validateText } from '../lib/validation';
import { Offer, OfferField } from '../lib/types';
import { Button } from './Button';
import { Field, FieldGroup } from './Field';
import { FieldBuilder } from './FieldBuilder';
import { Screen } from './Screen';
import { ErrorState } from './States';

type Payload = {
  title: string;
  price: number;
  limit: number;
  published: boolean;
  fields: OfferField[];
};

type Props = {
  title: string;
  initial?: Partial<Offer>;
  saving?: boolean;
  deleting?: boolean;
  archiving?: boolean;
  error?: string | null;
  savedHint?: string;
  onSubmit: (payload: Payload) => Promise<void>;
  onDelete?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  onUnarchive?: () => Promise<void>;
};

export function OfferEditor({
  title,
  initial,
  saving,
  deleting,
  archiving,
  error,
  savedHint,
  onSubmit,
  onDelete,
  onArchive,
  onUnarchive,
}: Props) {
  const [name, setName] = useState(initial?.title ?? '');
  const [price, setPrice] = useState(String(initial?.price ?? ''));
  const [limit, setLimit] = useState(String(initial?.limit ?? ''));
  const [published, setPublished] = useState(initial?.published ?? true);
  const [fields, setFields] = useState<OfferField[]>(initial?.fields ?? []);
  const [done, setDone] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  function collectErrors() {
    const next: Record<string, string> = {};
    const titleErr = validateText(name, { required: true, max: 80, label: 'Название' });
    if (titleErr) next.title = titleErr;
    const priceErr = validateMoney(price);
    if (priceErr) next.price = priceErr;
    const limitErr = validateMoney(limit);
    if (limitErr) next.limit = limitErr;
    fields.forEach((field) => {
      if (!field.label.trim()) next[field.id] = 'Нужна подпись поля';
      if (field.type === 'select' && !(field.options ?? []).map((item) => item.trim()).filter(Boolean).length) {
        next[`${field.id}_options`] = 'Добавьте хотя бы один вариант';
      }
    });
    return next;
  }

  async function submit() {
    setDone(false);
    setAttempted(true);
    const next = collectErrors();
    setFormErrors(next);
    if (Object.keys(next).length > 0) return;

    await onSubmit({
      title: name.trim(),
      price: Number(price),
      limit: Number(limit),
      published,
      fields: fields.map((field) => ({
        ...field,
        options:
          field.type === 'select'
            ? (field.options ?? []).map((item) => item.trim()).filter(Boolean)
            : undefined,
      })),
    });
    setDone(true);
  }

  function confirmDelete() {
    if (!onDelete) return;
    const ok =
      typeof window !== 'undefined'
        ? window.confirm(
            'Удалить событие? Черновик без заявок исчезнет. Если уже есть заявки — сначала отметьте людей выполненными и снимите событие в историю.',
          )
        : true;
    if (ok) void onDelete();
  }

  function confirmArchive() {
    if (!onArchive) return;
    const ok =
      typeof window !== 'undefined'
        ? window.confirm(
            'Снять событие в историю? С сайта оно исчезнет. Покупателей найдёте в Люди → История и поиском по ФИО.',
          )
        : true;
    if (ok) void onArchive();
  }

  function confirmUnarchive() {
    if (!onUnarchive) return;
    void onUnarchive();
  }

  const archived = Boolean(initial?.archived);
  const busy = Boolean(saving || deleting || archiving);

  return (
    <Screen inShell>
      <Text className="mb-6 text-2xl font-semibold text-ink">{title}</Text>
      {archived ? (
        <View className="mb-6 rounded-3xl border border-line bg-cream-soft p-4">
          <Text className="text-base font-medium text-ink">Событие в истории</Text>
          <Text className="mt-1 text-sm text-muted">
            На сайте его нет. Покупателей ищите в Людях — вкладка История и поиск по ФИО.
          </Text>
        </View>
      ) : null}
      {initial?.id ? (
        <Link href={`/admin/people?offerId=${initial.id}`} className="mb-4">
          <Text className="text-sm font-medium text-forest">Люди этого события →</Text>
        </Link>
      ) : null}
      <FieldGroup>
        <Field
          label="Название"
          value={name}
          onChangeText={(value) => setName(constrainInput('text', value))}
          placeholder="Карелия, 12–14 июня"
          error={attempted ? formErrors.title : undefined}
        />
        <Field
          label="Цена, ₽"
          value={price}
          onChangeText={(value) => setPrice(constrainInput('number', value))}
          keyboardType="number-pad"
          error={attempted ? formErrors.price : undefined}
        />
        <Field
          label="Лимит мест / штук"
          value={limit}
          onChangeText={(value) => setLimit(constrainInput('number', value))}
          keyboardType="number-pad"
          error={attempted ? formErrors.limit : undefined}
        />
        <Pressable
          onPress={() => setPublished((value) => !value)}
          disabled={archived}
          className="rounded-2xl border border-line bg-paper px-4 py-3"
        >
          <View className="flex-row items-center gap-3">
            <View className={`h-5 w-5 rounded ${published ? 'bg-forest' : 'border border-line bg-cream'}`} />
            <View className="flex-1">
              <Text className="text-base text-ink">
                {published ? 'Опубликовано на сайте' : 'Черновик — посетители это не видят'}
              </Text>
              <Text className="mt-1 text-sm text-muted">
                {published
                  ? 'Событие в каталоге. Снимите галочку, если нужно спрятать.'
                  : 'Включите, иначе на сайте у пользователя событие не появится.'}
              </Text>
            </View>
          </View>
        </Pressable>
      </FieldGroup>

      <View className="mt-8">
        <FieldBuilder
          fields={fields}
          onChange={setFields}
          attempted={attempted}
          fieldErrors={formErrors}
        />
      </View>

      {error ? (
        <View className="mt-6">
          <ErrorState text={error} />
        </View>
      ) : null}
      {done && savedHint && !error ? (
        <Text className="mt-4 text-sm text-forest">
          {published ? savedHint : `${savedHint}. Событие ещё черновик — на сайте его нет.`}
        </Text>
      ) : null}

      <View className="mt-6 gap-3">
        <Button title="Сохранить" onPress={submit} loading={saving} disabled={busy && !saving} />
        {onArchive && !archived ? (
          <Button
            title="Снять в историю"
            variant="secondary"
            onPress={confirmArchive}
            loading={archiving}
            disabled={busy && !archiving}
          />
        ) : null}
        {onUnarchive && archived ? (
          <Button
            title="Вернуть из истории"
            variant="ghost"
            onPress={confirmUnarchive}
            loading={archiving}
            disabled={busy && !archiving}
          />
        ) : null}
        {onDelete ? (
          <Button
            title="Удалить событие"
            variant="danger"
            onPress={confirmDelete}
            loading={deleting}
            disabled={busy && !deleting}
          />
        ) : null}
      </View>
    </Screen>
  );
}
