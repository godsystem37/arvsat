import { IsIn, IsString } from 'class-validator';

export const BOOKING_STATUSES = [
  'new',
  'confirmed',
  'refund_requested',
  'done',
  'cancelled',
] as const;

export class UpdateBookingStatusDto {
  @IsString()
  @IsIn(BOOKING_STATUSES)
  status!: (typeof BOOKING_STATUSES)[number];
}
