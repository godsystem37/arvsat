import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { isValidIsoDate } from '../lib/validation';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

type Cell = { iso: string; day: number; inMonth: boolean };

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseIso(value: string): Date | null {
  if (!isValidIsoDate(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftMonth(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function buildCells(cursor: Date): Cell[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysHere = new Date(year, month + 1, 0).getDate();
  const daysPrev = new Date(year, month, 0).getDate();
  const cells: Cell[] = [];

  for (let i = firstDow; i > 0; i -= 1) {
    const day = daysPrev - i + 1;
    const prev = new Date(year, month - 1, day);
    cells.push({
      iso: toIso(prev.getFullYear(), prev.getMonth(), day),
      day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysHere; day += 1) {
    cells.push({ iso: toIso(year, month, day), day, inMonth: true });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const next = new Date(year, month + 1, nextDay);
    cells.push({
      iso: toIso(next.getFullYear(), next.getMonth(), nextDay),
      day: nextDay,
      inMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

function formatPicked(iso: string) {
  const date = parseIso(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .replace(/\s?г\.?$/u, '');
}

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
};

export function DateField({ label, value, onChange, hint, error, required }: Props) {
  const selected = parseIso(value);
  const todayIso = toIso(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => startOfMonth(selected ?? new Date()));
  const cells = useMemo(() => buildCells(cursor), [cursor]);

  function pick(iso: string) {
    onChange(iso);
    setCursor(startOfMonth(parseIso(iso) ?? new Date()));
    setOpen(false);
  }

  function toggle() {
    setCursor(startOfMonth(selected ?? new Date()));
    setOpen((current) => !current);
  }

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? formatPicked(value) : 'Выберите дату'}
        onPress={toggle}
        className={`h-12 flex-row items-center justify-between rounded-2xl border bg-paper px-4 ${
          error ? 'border-danger' : open ? 'border-forest' : 'border-line'
        }`}
      >
        <Text className={`text-base ${value ? 'text-ink' : 'text-muted'}`}>
          {value ? formatPicked(value) : 'Выберите дату'}
        </Text>
        <Text className="text-muted">{open ? '▴' : '▾'}</Text>
      </Pressable>

      {open ? (
        <View className="rounded-3xl border border-line bg-paper p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Предыдущий месяц"
              onPress={() => setCursor((current) => shiftMonth(current, -1))}
              className="h-10 w-10 items-center justify-center rounded-full bg-cream-soft"
            >
              <Text className="text-lg text-ink">‹</Text>
            </Pressable>
            <Text className="text-base font-semibold text-ink">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Следующий месяц"
              onPress={() => setCursor((current) => shiftMonth(current, 1))}
              className="h-10 w-10 items-center justify-center rounded-full bg-cream-soft"
            >
              <Text className="text-lg text-ink">›</Text>
            </Pressable>
          </View>

          <View className="mb-1 flex-row">
            {WEEKDAYS.map((day) => (
              <Text key={day} className="flex-1 text-center text-xs font-medium text-muted">
                {day}
              </Text>
            ))}
          </View>

          {Array.from({ length: cells.length / 7 }, (_, week) => (
            <View key={week} className="flex-row">
              {cells.slice(week * 7, week * 7 + 7).map((cell) => {
                const isSelected = cell.iso === value;
                const isToday = cell.iso === todayIso && !isSelected;
                return (
                  <Pressable
                    key={cell.iso}
                    accessibilityRole="button"
                    accessibilityLabel={formatPicked(cell.iso)}
                    onPress={() => pick(cell.iso)}
                    className="flex-1 items-center py-1"
                  >
                    <View
                      className={`h-9 w-9 items-center justify-center rounded-full ${
                        isSelected ? 'bg-forest' : isToday ? 'bg-clay-soft' : ''
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          isSelected
                            ? 'font-semibold text-white'
                            : cell.inMonth
                              ? 'text-ink'
                              : 'text-muted opacity-40'
                        }`}
                      >
                        {cell.day}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {!required && value ? (
            <Pressable onPress={() => onChange('')} className="mt-2 items-center py-2">
              <Text className="text-sm text-muted">Сбросить</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <Text className="text-sm text-danger">{error}</Text>
      ) : hint ? (
        <Text className="text-sm text-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
