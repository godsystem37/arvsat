import { BookingStatus } from './types';
import { isValidIsoDate } from './validation';

export function formatPrice(value: number) {
  return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function remainingLabel(remaining: number, limit: number) {
  if (remaining <= 0) return 'Мест нет';
  if (remaining === 1) return 'Последнее место';
  return `Осталось ${remaining} из ${limit}`;
}

export function formatIsoDateRu(value: string) {
  if (!isValidIsoDate(value)) return value;
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date(year, month - 1, day))
    .replace(/\s?г\.?$/u, '');
}

export function formatAnswer(value: unknown) {
  if (value === true) return 'Да';
  if (value === false) return 'Нет';
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string' && isValidIsoDate(value)) return formatIsoDateRu(value);
  return String(value);
}

export const STATUS_ORDER: BookingStatus[] = [
  'new',
  'confirmed',
  'refund_requested',
  'done',
  'cancelled',
];
