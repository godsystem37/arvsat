export const FIELD_TYPES = [
  'text',
  'textarea',
  'phone',
  'email',
  'number',
  'select',
  'date',
  'checkbox',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export type OfferField = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
};

export function isFieldType(value: string): value is FieldType {
  return (FIELD_TYPES as readonly string[]).includes(value);
}

export function sanitizeFields(input: unknown): OfferField[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const seen = new Set<string>();
  const fields: OfferField[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') {
      continue;
    }
    const item = raw as Record<string, unknown>;
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    const type = typeof item.type === 'string' ? item.type : '';
    if (!label || !isFieldType(type)) {
      continue;
    }

    let id =
      typeof item.id === 'string' && item.id.trim()
        ? item.id.trim()
        : `f_${fields.length + 1}`;
    while (seen.has(id)) {
      id = `${id}_${fields.length + 1}`;
    }
    seen.add(id);

    const field: OfferField = {
      id,
      label,
      type,
      required: Boolean(item.required),
    };

    if (type === 'select') {
      const options = Array.isArray(item.options)
        ? item.options
            .filter((opt): opt is string => typeof opt === 'string')
            .map((opt) => opt.trim())
            .filter(Boolean)
        : [];
      field.options = options;
    }

    fields.push(field);
  }

  return fields;
}

export function parseFields(value: unknown): OfferField[] {
  return sanitizeFields(value);
}

export function validateAnswers(
  fields: OfferField[],
  answers: unknown,
): Record<string, unknown> {
  const source =
    answers && typeof answers === 'object' && !Array.isArray(answers)
      ? (answers as Record<string, unknown>)
      : {};
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    const value = source[field.id];

    if (field.type === 'checkbox') {
      result[field.id] = Boolean(value);
      continue;
    }

    if (value === undefined || value === null || value === '') {
      if (field.required) {
        throw new Error(`Заполните поле «${field.label}»`);
      }
      result[field.id] = null;
      continue;
    }

    if (field.type === 'number') {
      const num = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(num)) {
        throw new Error(`Поле «${field.label}» должно быть числом`);
      }
      result[field.id] = num;
      continue;
    }

    const text = String(value).trim();
    if (!text) {
      if (field.required) {
        throw new Error(`Заполните поле «${field.label}»`);
      }
      result[field.id] = null;
      continue;
    }

    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      throw new Error(`Поле «${field.label}» — некорректный email`);
    }

    if (field.type === 'select' && field.options && field.options.length > 0) {
      if (!field.options.includes(text)) {
        throw new Error(`Выберите вариант в поле «${field.label}»`);
      }
    }

    result[field.id] = text;
  }

  return result;
}
