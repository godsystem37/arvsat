import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { ShellNavItem } from './nav';

type Props = {
  item: ShellNavItem;
  pathname: string;
  compact?: boolean;
};

export function NavItem({ item, pathname, compact }: Props) {
  const active = Boolean(item.href && (item.match ? item.match(pathname) : pathname === item.href));

  if (!item.href) {
    return (
      <View
        className={`items-center rounded-2xl ${compact ? 'flex-1 py-2' : 'px-3 py-2.5'}`}
        accessibilityState={{ disabled: true }}
      >
        <Text className={`font-medium text-muted ${compact ? 'text-xs' : 'text-sm'}`}>{item.label}</Text>
        <Text className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">скоро</Text>
      </View>
    );
  }

  const body = (
    <View
      className={`items-center rounded-2xl ${
        compact ? 'flex-1 py-2' : 'px-3 py-2.5 items-start'
      } ${
        active
          ? 'bg-forest-soft'
          : item.emphasis
            ? 'bg-clay-soft'
            : ''
      }`}
    >
      <Text
        className={`font-medium ${compact ? 'text-xs' : 'text-sm'} ${
          active ? 'text-forest' : item.emphasis ? 'text-clay' : 'text-ink'
        }`}
      >
        {item.label}
      </Text>
    </View>
  );

  return (
    <Link href={item.href} asChild>
      <Pressable className={compact ? 'flex-1' : undefined} accessibilityRole="link">
        {body}
      </Pressable>
    </Link>
  );
}
