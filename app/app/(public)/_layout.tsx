import { usePathname } from 'expo-router';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { AppShell } from '../../src/shell/AppShell';
import { PUBLIC_NAV } from '../../src/shell/nav';

export default function PublicLayout() {
  const pathname = usePathname();
  return (
    <AppShell
      brand="Сбор"
      homeHref="/"
      items={PUBLIC_NAV}
      pathname={pathname}
      footer={<ThemeToggle />}
    />
  );
}
