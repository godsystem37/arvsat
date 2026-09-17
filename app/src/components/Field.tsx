import { ReactNode } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
};

export function Field({ label, hint, error, multiline, ...input }: Props) {
  const { colors } = useTheme();
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <TextInput
        {...input}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        className={`rounded-2xl border bg-paper px-4 text-base text-ink ${
          multiline ? 'min-h-[96px] py-3' : 'h-12'
        } ${error ? 'border-danger' : 'border-line'}`}
      />
      {error ? (
        <Text className="text-sm text-danger">{error}</Text>
      ) : hint ? (
        <Text className="text-sm text-muted">{hint}</Text>
      ) : null}
    </View>
  );
}

export function FieldGroup({ children }: { children: ReactNode }) {
  return <View className="gap-4">{children}</View>;
}
