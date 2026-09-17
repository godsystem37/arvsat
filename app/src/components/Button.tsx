import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
};

const styles: Record<Variant, { btn: string; text: string }> = {
  primary: {
    btn: 'bg-clay',
    text: 'text-white',
  },
  secondary: {
    btn: 'bg-forest',
    text: 'text-white',
  },
  ghost: {
    btn: 'bg-transparent border border-line',
    text: 'text-ink',
  },
  danger: {
    btn: 'bg-danger',
    text: 'text-white',
  },
};

export function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: Props) {
  const { colors } = useTheme();
  const look = styles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`min-h-[48px] items-center justify-center rounded-2xl px-4 ${look.btn} ${
        disabled || loading ? 'opacity-50' : 'active:opacity-80'
      }`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.ink : '#fff'} />
      ) : (
        <Text className={`text-base font-semibold ${look.text}`}>{title}</Text>
      )}
    </Pressable>
  );
}
