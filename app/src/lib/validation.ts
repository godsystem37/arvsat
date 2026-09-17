export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_E164_RE = /^\+7\d{10}$/;

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

export function formatPhoneRu(input: string): string {
  let digits = digitsOnly(input);
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (digits.length === 0) return '';
  if (!digits.startsWith('7')) digits = `7${digits}`;
  digits = digits.slice(0, 11);
  const rest = digits.slice(1);
  let out = '+7';
  if (rest.length === 0) return out;
  out += ` (${rest.slice(0, 3)}`;
  if (rest.length < 3) return out;
  out += ')';
  if (rest.length > 3) out += ` ${rest.slice(3, 6)}`;
  if (rest.length > 6) out += `-${rest.slice(6, 8)}`;
  if (rest.length > 8) out += `-${rest.slice(8, 10)}`;
  return out;
}

const FIO_LETTER_RE = /[A-Za-zА-Яа-яЁё]/;
export const FIO_RE =
  /^[A-ZА-ЯЁ][a-zа-яё]+(?:-[A-ZА-ЯЁ][a-zа-яё]+)*(?: [A-ZА-ЯЁ][a-zа-яё]+(?:-[A-ZА-ЯЁ][a-zа-яё]+)*){2}$/;

function capitalizeFioPart(part: string) {
  if (!part) return '';
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

function capitalizeFioWord(word: string) {
  const trailingHyphen = word.endsWith('-');
  const body = word
    .split('-')
    .filter(Boolean)
    .map(capitalizeFioPart)
    .join('-');
  return trailingHyphen && body ? `${body}-` : body;
}

export function formatFioInput(input: string): string {
  let cleaned = '';
  for (const ch of input.normalize('NFC')) {
    if (FIO_LETTER_RE.test(ch) || ch === '-' || ch === ' ') cleaned += ch;
  }
  cleaned = cleaned.replace(/^[\s-]+/, '').replace(/ {2,}/g, ' ').replace(/-{2,}/g, '-');
  cleaned = cleaned.replace(/(^| )-/g, '$1').replace(/-(?= )/g, '');
  const trailingSpace = cleaned.endsWith(' ');
  const words = cleaned.trim().split(' ').filter(Boolean).slice(0, 3).map(capitalizeFioWord);
  let out = words.join(' ');
  if (trailingSpace && words.length > 0 && words.length < 3) out += ' ';
  return out.slice(0, 80);
}

export function formatFio(value: string): string {
  return formatFioInput(value).trim().replace(/-$/, '');
}

export function formatDateInput(value: string): string {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
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

export function formatIntegerInput(value: string): string {
  return digitsOnly(value);
}

export function validateFio(value: string): string | null {
  const text = formatFio(value);
  if (!text) return 'Укажите ФИО';
  if (text.split(' ').length !== 3) return 'ФИО — фамилия, имя и отчество';
  if (text.length > 80) return 'ФИО слишком длинное';
  if (!FIO_RE.test(text)) return 'Каждое слово с заглавной буквы, только буквы';
  return null;
}

export const validateName = validateFio;

export function validatePhone(value: string, required = true): string | null {
  const text = value.trim();
  if (!text) return required ? 'Укажите телефон' : null;
  if (!toE164Ru(text)) return 'Телефон в формате +7 (999) 123-45-67';
  return null;
}

export function validateEmail(value: string, required = false): string | null {
  const text = value.trim();
  if (!text) return required ? 'Укажите почту' : null;
  if (!EMAIL_RE.test(text)) return 'Некорректный email';
  if (text.length > 120) return 'Email слишком длинный';
  return null;
}

export function validateQuantity(value: string, max: number): string | null {
  if (!/^\d+$/.test(value.trim())) return 'Введите целое число';
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) return 'Минимум 1';
  if (max > 0 && num > max) return `Можно не больше ${max}`;
  return null;
}

export function validateMoney(value: string): string | null {
  if (!/^\d+$/.test(value.trim())) return 'Введите целое число';
  return null;
}

export function validateText(
  value: string,
  options: { required?: boolean; max?: number; label?: string } = {},
): string | null {
  const text = value.trim();
  const label = options.label ?? 'Поле';
  if (!text) return options.required ? `Заполните «${label}»` : null;
  if (text.length > (options.max ?? 200)) return `Слишком длинный текст в «${label}»`;
  return null;
}

export function validateDate(value: string, required = false, label = 'Дата'): string | null {
  const text = value.trim();
  if (!text) return required ? `Выберите «${label}»` : null;
  if (!isValidIsoDate(text)) return `Выберите «${label}» в календаре`;
  return null;
}

export function validateNumberValue(
  value: unknown,
  required = false,
  label = 'Число',
): string | null {
  if (value === undefined || value === null || value === '') {
    return required ? `Заполните «${label}»` : null;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(num) || num < 0) return `«${label}» — целое число`;
  return null;
}

export function constrainInput(
  type: 'phone' | 'date' | 'number' | 'email' | 'text' | 'textarea' | 'fio',
  value: string,
): string {
  if (type === 'fio') return formatFioInput(value);
  if (type === 'phone') return formatPhoneRu(value);
  if (type === 'date') return formatDateInput(value);
  if (type === 'number') return formatIntegerInput(value);
  if (type === 'email') return value.replace(/\s/g, '').slice(0, 120);
  if (type === 'textarea') return value.slice(0, 2000);
  return value.slice(0, 200);
}
