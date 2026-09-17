export type ShellNavItem = {
  id: string;
  label: string;
  href?: string;
  match?: (pathname: string) => boolean;
  emphasis?: boolean;
};

export const PUBLIC_NAV: ShellNavItem[] = [
  {
    id: 'sbor',
    label: 'Сбор',
    href: '/',
    match: (path) =>
      path === '/' ||
      path.startsWith('/offers') ||
      path.startsWith('/b/') ||
      path.startsWith('/success'),
  },
  { id: 'bookings', label: 'Заявки' },
  { id: 'chat', label: 'Чат' },
  { id: 'profile', label: 'Профиль' },
  {
    id: 'login',
    label: 'Войти',
    href: '/login',
    match: (path) => path.startsWith('/login'),
    emphasis: true,
  },
];

export const ADMIN_NAV: ShellNavItem[] = [
  {
    id: 'events',
    label: 'События',
    href: '/admin/offers',
    match: (path) => path.includes('/offers'),
  },
  {
    id: 'people',
    label: 'Люди',
    href: '/admin/people',
    match: (path) => path.includes('/people'),
  },
  { id: 'settings', label: 'Настройки' },
  { id: 'mail', label: 'Рассылка' },
];
