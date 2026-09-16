import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Field, FieldGroup } from './Field';
import { FieldBuilder } from './FieldBuilder';
import { Screen } from './Screen';
import { ErrorState } from './States';
import { Button } from './Button';
import { Offer, OfferField } from '../lib/types';

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
  error?: string | null;
  savedHint?: string;
  onSubmit: (payload: Payload) => Promise<void>;
};

export function OfferEditor({ title, initial, saving, error, savedHint, onSubmit }: Props) {
  const [name, setName] = useState(initial?.title ?? '');
  const [price, setPrice] = useState(String(initial?.price ?? ''));
  const [limit, setLimit] = useState(String(initial?.limit ?? ''));
  const [published, setPublished] = useState(Boolean(initial?.published));
  const [fields, setFields] = useState<OfferField[]>(initial?.fields ?? []);
  const [done, setDone] = useState(false);

  async function submit() {
    setDone(false);
    await onSubmit({
      title: name.trim(),
      price: Number(price) || 0,
      limit: Number(limit) || 0,
      published,
      fields: fields.filter((field) => field.label.trim()),
    });
    setDone(true);
  }

  return (
    <Screen>
      <Text className="mb-6 text-2xl font-semibold text-ink">{title}</Text>
      <FieldGroup>
        <Field label="Название" value={name} onChangeText={setName} placeholder="Карелия, 12–14 июня" />
        <Field label="Цена, ₽" value={price} onChangeText={setPrice} keyboardType="number-pad" />
        <Field
          label="Лимит мест / штук"
          value={limit}
          onChangeText={setLimit}
          keyboardType="number-pad"
        />
        <Pressable
          onPress={() => setPublished((value) => !value)}
          className="flex-row items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3"
        >
          <View className={`h-5 w-5 rounded ${published ? 'bg-forest' : 'border border-line bg-cream'}`} />
          <Text className="text-base text-ink">
            {published ? 'Опубликован на сайте' : 'Черновик — на сайте не видно'}
          </Text>
        </Pressable>
      </FieldGroup>

      <View className="mt-8">
        <FieldBuilder fields={fields} onChange={setFields} />
      </View>

      {error ? (
        <View className="mt-6">
          <ErrorState text={error} />
        </View>
      ) : null}
      {done && savedHint && !error ? (
        <Text className="mt-4 text-sm text-forest">{savedHint}</Text>
      ) : null}

      <View className="mt-6">
        <Button title="Сохранить" onPress={submit} loading={saving} disabled={!name.trim()} />
      </View>
    </Screen>
  );
}
