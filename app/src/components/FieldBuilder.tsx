import { Pressable, Text, View } from 'react-native';
import { FIELD_TYPE_LABEL, FIELD_TYPES, FieldType, OfferField } from '../lib/types';
import { Field } from './Field';

function createField(type: FieldType): OfferField {
  return {
    id: `f_${Math.random().toString(36).slice(2, 9)}`,
    label: '',
    type,
    required: false,
    options: type === 'select' ? ['Вариант 1'] : undefined,
  };
}

type Props = {
  fields: OfferField[];
  onChange: (fields: OfferField[]) => void;
};

export function FieldBuilder({ fields, onChange }: Props) {
  const update = (index: number, patch: Partial<OfferField>) => {
    onChange(fields.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= fields.length) return;
    const copy = [...fields];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  };

  return (
    <View className="gap-4">
      <Text className="text-lg font-semibold text-ink">Поля заявки</Text>
      <Text className="text-sm text-muted">
        Имя, телефон, почта и количество уже есть. Здесь — всё остальное, что нужно собрать с человека.
      </Text>

      {fields.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-line px-4 py-5">
          <Text className="text-muted">Пока только контактные поля. Добавьте дату, адрес или вопрос.</Text>
        </View>
      ) : null}

      {fields.map((field, index) => (
        <View key={field.id} className="gap-3 rounded-2xl border border-line bg-paper p-4">
          <Field
            label="Подпись поля"
            value={field.label}
            onChangeText={(label) => update(index, { label })}
            placeholder="Например: адрес доставки"
          />
          <Text className="text-sm font-medium text-ink">Тип</Text>
          <View className="flex-row flex-wrap gap-2">
            {FIELD_TYPES.map((type) => {
              const selected = field.type === type;
              return (
                <Pressable
                  key={type}
                  onPress={() =>
                    update(index, {
                      type,
                      options: type === 'select' ? field.options ?? ['Вариант 1'] : undefined,
                    })
                  }
                  className={`rounded-full px-3 py-1.5 ${
                    selected ? 'bg-forest' : 'bg-cream'
                  }`}
                >
                  <Text className={`text-xs ${selected ? 'text-white' : 'text-ink'}`}>
                    {FIELD_TYPE_LABEL[type]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {field.type === 'select' ? (
            <Field
              label="Варианты через запятую"
              value={(field.options ?? []).join(', ')}
              onChangeText={(text) =>
                update(index, {
                  options: text
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
            />
          ) : null}

          <View className="flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => update(index, { required: !field.required })}
              className={`rounded-full px-3 py-1.5 ${field.required ? 'bg-clay' : 'bg-cream'}`}
            >
              <Text className={`text-xs ${field.required ? 'text-white' : 'text-ink'}`}>
                {field.required ? 'Обязательное' : 'Необязательное'}
              </Text>
            </Pressable>
            <Pressable onPress={() => move(index, -1)} className="rounded-full bg-cream px-3 py-1.5">
              <Text className="text-xs text-ink">Выше</Text>
            </Pressable>
            <Pressable onPress={() => move(index, 1)} className="rounded-full bg-cream px-3 py-1.5">
              <Text className="text-xs text-ink">Ниже</Text>
            </Pressable>
            <Pressable
              onPress={() => onChange(fields.filter((_, i) => i !== index))}
              className="rounded-full bg-[#F6E1D6] px-3 py-1.5"
            >
              <Text className="text-xs text-danger">Удалить</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View className="flex-row flex-wrap gap-2">
        {(['text', 'textarea', 'select', 'checkbox', 'date'] as FieldType[]).map((type) => (
          <Pressable
            key={type}
            onPress={() => onChange([...fields, createField(type)])}
            className="rounded-full border border-line px-3 py-2"
          >
            <Text className="text-sm text-ink">+ {FIELD_TYPE_LABEL[type]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
