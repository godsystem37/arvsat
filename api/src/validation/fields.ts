export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_E164_RE = /^\+7\d{10}$/;
export const FIO_RE =
  /^[A-ZА-ЯЁ][a-zа-яё]+(?:-[A-ZА-ЯЁ][a-zа-яё]+)*(?: [A-ZА-ЯЁ][a-zа-яё]+(?:-[A-ZА-ЯЁ][a-zа-яё]+)*){2}$/;
const FIO_LETTER_RE = /[A-Za-zА-Яа-яЁё]/;

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function toE164Ru(input: string): string | null {
  let digits = digitsOnly(input);
  if (digits.startsWith('8') && digits.length === 11) {
    digits = `7${digits.slice(1)}`;
  }
  if (digits.length === 10) digits = `7${digits}`;
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`;
  }
  return null;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function capitalizeFioPart(part: string) {
  if (!part) return '';
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

export function formatFio(input: string): string {
  let cleaned = '';
  for (const ch of input.normalize('NFC')) {
    if (FIO_LETTER_RE.test(ch) || ch === '-' || ch === ' ') cleaned += ch;
  }
  cleaned = cleaned.replace(/^[\s-]+/, '').replace(/ {2,}/g, ' ').replace(/-{2,}/g, '-');
  cleaned = cleaned.replace(/(^| )-/g, '$1').replace(/-(?= )/g, '');
  return cleaned
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word.split('-').filter(Boolean).map(capitalizeFioPart).join('-'))
    .join(' ')
    .slice(0, 80);
}

export function assertFio(value: string) {
  const text = formatFio(value);
  if (!FIO_RE.test(text) || text.length > 80) {
    throw new Error('ФИО — фамилия, имя и отчество с заглавной буквы');
  }
  return text;
}

export function assertPhone(value: string) {
  const e164 = toE164Ru(value);
  if (!e164) {
    throw new Error('Телефон в формате +7XXXXXXXXXX');
  }
  return e164;
}

export function assertEmail(value: string | null | undefined) {
  const text = value?.trim() ?? '';
  if (!text) return null;
  if (!EMAIL_RE.test(text) || text.length > 120) {
    throw new Error('Некорректный email');
  }
  return text.toLowerCase();
}

export function assertIsoDate(value: string, label: string) {
  if (!isValidIsoDate(value)) {
    throw new Error(`Выберите «${label}» в календаре`);
  }
  return value;
}
