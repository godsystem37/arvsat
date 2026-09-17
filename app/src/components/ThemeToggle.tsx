import { Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function ThemeToggle() {
  const { mode, toggle } = useTheme();
  return (
    <Pressable onPress={toggle} hitSlop={8} accessibilityRole="button" accessibilityLabel="Сменить тему">
      <Text className="text-sm text-forest">{mode === 'dark' ? 'Светлая' : 'Тёмная'}</Text>
    </Pressable>
  );
}
