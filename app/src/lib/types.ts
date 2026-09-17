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
  placeholder?: string;
  hint?: string;
};

export type Offer = {
  id: string;
  title: string;
  price: number;
  limit: number;
  published: boolean;
  archived?: boolean;
  fields: OfferField[];
  remaining: number;
  createdAt: string;
  updatedAt: string;
};

export type BookingStatus =
  | 'new'
  | 'confirmed'
  | 'refund_requested'
  | 'done'
  | 'cancelled';

export type BookingComment = {
  id: string;
  body: string;
  createdAt: string;
};

export type Booking = {
  id: string;
  token: string;
  code: string;
  name: string;
  phone: string;
  email: string | null;
  quantity: number;
  answers: Record<string, unknown>;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  url: string;
  offer: {
    id: string;
    title: string;
    price: number;
    fields: OfferField[];
  };
  comments: BookingComment[];
};

export const STATUS_LABEL: Record<BookingStatus, string> = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  refund_requested: 'Возврат',
  done: 'Выполнено',
  cancelled: 'Отменена',
};

export const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: 'Текст',
  textarea: 'Много строк',
  phone: 'Телефон',
  email: 'Email',
  number: 'Число',
  select: 'Список',
  date: 'Дата',
  checkbox: 'Да / нет',
};
