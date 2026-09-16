import { Pressable, Text, View } from 'react-native';
import { OfferField } from '../lib/types';
import { Field } from './Field';

type Props = {
  fields: OfferField[];
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
};

export function DynamicFields({ fields, values, onChange }: Props) {
  return (
    <View className="gap-4">
      {fields.map((field) => {
        const value = values[field.id];
        const label = field.required ? `${field.label} *` : field.label;

        if (field.type === 'checkbox') {
          const checked = Boolean(value);
          return (
            <Pressable
              key={field.id}
              onPress={() => onChange(field.id, !checked)}
              className="flex-row items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3"
            >
              <View
                className={`h-5 w-5 items-center justify-center rounded ${
                  checked ? 'bg-forest' : 'border border-line bg-cream'
                }`}
              >
                {checked ? <Text className="text-xs text-white">✓</Text> : null}
              </View>
              <Text className="flex-1 text-base text-ink">{label}</Text>
            </Pressable>
          );
        }

        if (field.type === 'select') {
          return (
            <View key={field.id} className="gap-1.5">
              <Text className="text-sm font-medium text-ink">{label}</Text>
              <View className="gap-2">
                {(field.options ?? []).map((option) => {
                  const selected = value === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => onChange(field.id, option)}
                      className={`rounded-2xl border px-4 py-3 ${
                        selected ? 'border-forest bg-[#DCEBE4]' : 'border-line bg-paper'
                      }`}
                    >
                      <Text className="text-base text-ink">{option}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        }

        const keyboard =
          field.type === 'email'
            ? 'email-address'
            : field.type === 'number' || field.type === 'phone'
              ? 'numeric'
              : 'default';

        return (
          <Field
            key={field.id}
            label={label}
            value={value == null ? '' : String(value)}
            onChangeText={(text) => onChange(field.id, text)}
            multiline={field.type === 'textarea'}
            keyboardType={keyboard}
            autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
            placeholder={field.type === 'date' ? 'ГГГГ-ММ-ДД' : undefined}
          />
        );
      })}
    </View>
  );
}
