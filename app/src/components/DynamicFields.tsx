import { Pressable, Text, View } from 'react-native';
import { OfferField } from '../lib/types';
import { constrainInput } from '../lib/validation';
import { DateField } from './DateField';
import { Field } from './Field';

type Props = {
  fields: OfferField[];
  values: Record<string, unknown>;
  errors?: Record<string, string>;
  onChange: (id: string, value: unknown) => void;
};

export function DynamicFields({ fields, values, errors = {}, onChange }: Props) {
  return (
    <View className="gap-4">
      {fields.map((field) => {
        const value = values[field.id];
        const label = field.required ? `${field.label} *` : field.label;
        const placeholder =
          field.placeholder ??
          (field.type === 'phone' ? '+7 (999) 123-45-67' : undefined);
        const error = errors[field.id];

        if (field.type === 'checkbox') {
          const checked = Boolean(value);
          return (
            <Pressable
              key={field.id}
              onPress={() => onChange(field.id, !checked)}
              className={`flex-row items-center gap-3 rounded-2xl border bg-paper px-4 py-3 ${
                error ? 'border-danger' : 'border-line'
              }`}
            >
              <View
                className={`h-5 w-5 items-center justify-center rounded ${
                  checked ? 'bg-forest' : 'border border-line bg-cream'
                }`}
              >
                {checked ? <Text className="text-xs text-white">✓</Text> : null}
              </View>
              <View className="flex-1">
                <Text className="text-base text-ink">{label}</Text>
                {error ? (
                  <Text className="mt-1 text-sm text-danger">{error}</Text>
                ) : field.hint ? (
                  <Text className="mt-1 text-sm text-muted">{field.hint}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        }

        if (field.type === 'select') {
          return (
            <View key={field.id} className="gap-1.5">
              <Text className="text-sm font-medium text-ink">{label}</Text>
              {field.hint && !error ? <Text className="text-sm text-muted">{field.hint}</Text> : null}
              {error ? <Text className="text-sm text-danger">{error}</Text> : null}
              <View className="gap-2">
                {(field.options ?? []).map((option) => {
                  const selected = value === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => onChange(field.id, option)}
                      className={`rounded-2xl border px-4 py-3 ${
                        selected ? 'border-forest bg-forest-soft' : 'border-line bg-paper'
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

        if (field.type === 'date') {
          return (
            <DateField
              key={field.id}
              label={label}
              value={value == null ? '' : String(value)}
              onChange={(next) => onChange(field.id, next)}
              hint={field.hint}
              error={error}
              required={field.required}
            />
          );
        }

        const keyboard =
          field.type === 'email'
            ? 'email-address'
            : field.type === 'number' || field.type === 'phone'
              ? 'phone-pad'
              : 'default';

        const typed =
          field.type === 'phone' ||
          field.type === 'number' ||
          field.type === 'email' ||
          field.type === 'textarea'
            ? field.type
            : 'text';

        return (
          <Field
            key={field.id}
            label={label}
            value={value == null ? '' : String(value)}
            onChangeText={(text) => onChange(field.id, constrainInput(typed, text))}
            multiline={field.type === 'textarea'}
            keyboardType={keyboard}
            autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
            placeholder={placeholder}
            hint={field.hint}
            error={error}
          />
        );
      })}
    </View>
  );
}
