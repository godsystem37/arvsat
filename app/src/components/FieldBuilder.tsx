import { Pressable, Text, View } from 'react-native';
import { FIELD_TYPE_LABEL, FIELD_TYPES, FieldType, OfferField } from '../lib/types';
import { Field } from './Field';

function createField(type: FieldType, patch: Partial<OfferField> = {}): OfferField {
  return {
    id: `f_${Math.random().toString(36).slice(2, 9)}`,
    label: patch.label ?? '',
    type,
    required: patch.required ?? false,
    placeholder: patch.placeholder,
    hint: patch.hint,
    options: type === 'select' ? patch.options ?? ['Вариант 1'] : undefined,
  };
}

const PRESETS: Array<{ title: string; field: Partial<OfferField> & { type: FieldType } }> = [
  { title: 'Адрес', field: { type: 'textarea', label: 'Адрес', placeholder: 'Город, улица, дом', required: true } },
  { title: 'Дата', field: { type: 'date', label: 'Дата', hint: 'Календарь, без ручного ввода', required: true } },
  { title: 'Список', field: { type: 'select', label: 'Выберите вариант', options: ['Вариант 1', 'Вариант 2'], required: true } },
  { title: 'Да / нет', field: { type: 'checkbox', label: 'Нужно дополнительно', required: false } },
  { title: 'Комментарий', field: { type: 'textarea', label: 'Комментарий', required: false } },
  { title: 'Число', field: { type: 'number', label: 'Количество', placeholder: '1', required: false } },
  { title: 'Телефон', field: { type: 'phone', label: 'Доп. телефон', placeholder: '+7 …', required: false } },
  { title: 'Email', field: { type: 'email', label: 'Доп. почта', required: false } },
];

type Props = {
  fields: OfferField[];
  onChange: (fields: OfferField[]) => void;
  attempted?: boolean;
  fieldErrors?: Record<string, string>;
};

export function FieldBuilder({ fields, onChange, attempted, fieldErrors = {} }: Props) {
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

  const duplicate = (index: number) => {
    const source = fields[index];
    onChange([
      ...fields.slice(0, index + 1),
      createField(source.type, { ...source, label: source.label ? `${source.label} (копия)` : '' }),
      ...fields.slice(index + 1),
    ]);
  };

  const setOption = (index: number, optionIndex: number, value: string) => {
    const options = [...(fields[index].options ?? [])];
    options[optionIndex] = value;
    update(index, { options });
  };

  const addOption = (index: number) => {
    update(index, { options: [...(fields[index].options ?? []), ''] });
  };

  const removeOption = (index: number, optionIndex: number) => {
    update(index, {
      options: (fields[index].options ?? []).filter((_, i) => i !== optionIndex),
    });
  };

  return (
    <View className="gap-4">
      <View>
        <Text className="text-lg font-semibold text-ink">Поля заявки</Text>
        <Text className="mt-1 text-sm text-muted">
          ФИО, телефон, почта и количество уже есть. Добавьте любое своё поле — тип можно сменить
          после, подпись и подсказку заполнить позже.
        </Text>
      </View>

      {fields.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-line px-4 py-5">
          <Text className="text-muted">Пока только контактные поля. Ниже — готовые шаблоны или пустой тип.</Text>
        </View>
      ) : null}

      {fields.map((field, index) => {
        const missingLabel = attempted && !field.label.trim();
        const optionsError = attempted ? fieldErrors[`${field.id}_options`] : undefined;
        return (
          <View key={field.id} className="gap-3 rounded-2xl border border-line bg-paper p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-muted">Поле {index + 1}</Text>
              <Text className="text-xs text-muted">{FIELD_TYPE_LABEL[field.type]}</Text>
            </View>

            <Field
              label="Подпись"
              value={field.label}
              onChangeText={(label) => update(index, { label })}
              placeholder="Например: адрес доставки"
              error={missingLabel ? 'Без подписи поле не сохранится' : undefined}
            />
            {field.type !== 'date' && field.type !== 'checkbox' ? (
              <Field
                label="Подсказка внутри поля"
                value={field.placeholder ?? ''}
                onChangeText={(placeholder) => update(index, { placeholder })}
                placeholder="Необязательно"
              />
            ) : null}
            <Field
              label="Пояснение под полем"
              value={field.hint ?? ''}
              onChangeText={(hint) => update(index, { hint })}
              placeholder="Необязательно. Например: напишите аллергии"
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
                        options:
                          type === 'select'
                            ? field.options?.length
                              ? field.options
                              : ['Вариант 1']
                            : undefined,
                      })
                    }
                    className={`rounded-full px-3 py-1.5 ${selected ? 'bg-forest' : 'bg-cream'}`}
                  >
                    <Text className={`text-xs ${selected ? 'text-white' : 'text-ink'}`}>
                      {FIELD_TYPE_LABEL[type]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {field.type === 'select' ? (
              <View className="gap-2">
                <Text className="text-sm font-medium text-ink">Варианты списка</Text>
                {(field.options ?? []).map((option, optionIndex) => (
                  <View key={`${field.id}-opt-${optionIndex}`} className="flex-row items-center gap-2">
                    <View className="flex-1">
                      <Field
                        label={`Вариант ${optionIndex + 1}`}
                        value={option}
                        onChangeText={(value) => setOption(index, optionIndex, value)}
                        placeholder="Текст варианта"
                      />
                    </View>
                    <Pressable
                      onPress={() => removeOption(index, optionIndex)}
                      className="mt-5 rounded-full bg-clay-soft px-3 py-2"
                    >
                      <Text className="text-xs text-danger">Убрать</Text>
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  onPress={() => addOption(index)}
                  className="self-start rounded-full border border-line px-3 py-2"
                >
                  <Text className="text-sm text-ink">+ Вариант</Text>
                </Pressable>
                {optionsError ? <Text className="text-sm text-danger">{optionsError}</Text> : null}
              </View>
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
              <Pressable onPress={() => duplicate(index)} className="rounded-full bg-cream px-3 py-1.5">
                <Text className="text-xs text-ink">Дублировать</Text>
              </Pressable>
              <Pressable
                onPress={() => onChange(fields.filter((_, i) => i !== index))}
                className="rounded-full bg-clay-soft px-3 py-1.5"
              >
                <Text className="text-xs text-danger">Удалить</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <View className="gap-2">
        <Text className="text-sm font-medium text-ink">Добавить поле</Text>
        <View className="flex-row flex-wrap gap-2">
          {FIELD_TYPES.map((type) => (
            <Pressable
              key={type}
              onPress={() => onChange([...fields, createField(type)])}
              className="rounded-full border border-line px-3 py-2"
            >
              <Text className="text-sm text-ink">+ {FIELD_TYPE_LABEL[type]}</Text>
            </Pressable>
          ))}
        </View>
        <Text className="mt-2 text-sm font-medium text-ink">Или шаблон</Text>
        <View className="flex-row flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Pressable
              key={preset.title}
              onPress={() => onChange([...fields, createField(preset.field.type, preset.field)])}
              className="rounded-full bg-cream px-3 py-2"
            >
              <Text className="text-sm text-ink">{preset.title}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
