import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsString } from 'class-validator';
import { BOOKING_STATUSES } from './update-booking-status.dto';

export class BulkUpdateStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids!: string[];

  @IsString()
  @IsIn(BOOKING_STATUSES)
  status!: (typeof BOOKING_STATUSES)[number];
}
