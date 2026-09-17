import { Link, Slot } from 'expo-router';
import { ReactNode } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavItem } from './NavItem';
import { ShellNavItem } from './nav';

const DESKTOP = 900;

type Props = {
  brand: string;
  homeHref: string;
  items: ShellNavItem[];
  pathname: string;
  footer?: ReactNode;
};

export function AppShell({ brand, homeHref, items, pathname, footer }: Props) {
  const { width } = useWindowDimensions();
  const desktop = width >= DESKTOP;

  if (desktop) {
    return (
      <View className="flex-1 flex-row bg-cream">
        <SafeAreaView edges={['left', 'top', 'bottom']} className="w-60 border-r border-line bg-paper">
          <View className="flex-1 px-4 py-5">
            <Link href={homeHref}>
              <Text className="text-2xl font-semibold text-ink">{brand}</Text>
            </Link>
            <Text className="mt-1 text-xs text-muted">Разделы приложения</Text>
            <View className="mt-6 gap-1">
              {items.map((item) => (
                <NavItem key={item.id} item={item} pathname={pathname} />
              ))}
            </View>
            <View className="mt-auto gap-3 pt-6">{footer}</View>
          </View>
        </SafeAreaView>
        <View className="flex-1 bg-cream">
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="border-b border-line bg-paper">
        <View className="flex-row items-center justify-between px-5 py-3">
          <Link href={homeHref}>
            <Text className="text-xl font-semibold text-ink">{brand}</Text>
          </Link>
          <View className="flex-row items-center gap-3">{footer}</View>
        </View>
      </SafeAreaView>
      <View className="flex-1">
        <Slot />
      </View>
      <SafeAreaView edges={['bottom']} className="border-t border-line bg-paper">
        <View className="flex-row px-1 py-1">
          {items.map((item) => (
            <NavItem key={item.id} item={item} pathname={pathname} compact />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}
