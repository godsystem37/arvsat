import { IsIn, IsString } from 'class-validator';

export const BOOKING_STATUSES = [
  'new',
  'confirmed',
  'cancelled',
  'refund_requested',
] as const;

export class UpdateBookingStatusDto {
  @IsString()
  @IsIn(BOOKING_STATUSES)
  status!: (typeof BOOKING_STATUSES)[number];
}
