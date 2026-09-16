import { clearAdminToken, getAdminToken } from './auth';
import { Booking, Offer } from './types';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:43128';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function readMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback;
  const message = (body as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message) && message.length) return message.join('\n');
  return fallback;
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.auth) {
    const token = await getAdminToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (res.status === 401 && options.auth) {
    await clearAdminToken();
  }

  if (!res.ok) {
    throw new ApiError(res.status, readMessage(data, 'Не получилось выполнить запрос'));
  }

  return data as T;
}

export const api = {
  offers: () => request<Offer[]>('/offers'),
  offer: (id: string) => request<Offer>(`/offers/${id}`),
  createBooking: (
    offerId: string,
    body: {
      name: string;
      phone: string;
      email?: string;
      quantity: number;
      answers: Record<string, unknown>;
    },
  ) =>
    request<Booking>(`/offers/${offerId}/bookings`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  booking: (token: string) => request<Booking>(`/bookings/${token}`),
  cancelBooking: (token: string) =>
    request<Booking>(`/bookings/${token}/cancel`, { method: 'POST' }),
  refundBooking: (token: string) =>
    request<Booking>(`/bookings/${token}/refund`, { method: 'POST' }),
  login: (email: string, password: string) =>
    request<{ token: string; admin: { id: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () =>
    request<{ id: string; email: string }>('/auth/me', { auth: true }),
  adminOffers: () => request<Offer[]>('/admin/offers', { auth: true }),
  adminOffer: (id: string) => request<Offer>(`/admin/offers/${id}`, { auth: true }),
  createOffer: (body: Partial<Offer> & { title: string; price: number; limit: number }) =>
    request<Offer>('/admin/offers', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(body),
    }),
  updateOffer: (id: string, body: Partial<Offer>) =>
    request<Offer>(`/admin/offers/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(body),
    }),
  adminBookings: (params: { offerId?: string; status?: string; q?: string }) => {
    const query = new URLSearchParams();
    if (params.offerId) query.set('offerId', params.offerId);
    if (params.status) query.set('status', params.status);
    if (params.q) query.set('q', params.q);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<Booking[]>(`/admin/bookings${suffix}`, { auth: true });
  },
  adminBooking: (id: string) =>
    request<Booking>(`/admin/bookings/${id}`, { auth: true }),
  updateBookingStatus: (id: string, status: string) =>
    request<Booking>(`/admin/bookings/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status }),
    }),
  addComment: (id: string, body: string) =>
    request<Booking>(`/admin/bookings/${id}/comments`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ body }),
    }),
};
