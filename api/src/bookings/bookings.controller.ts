import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller()
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post('offers/:offerId/bookings')
  create(
    @Param('offerId') offerId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookings.create(offerId, dto);
  }

  @Get('bookings/:token')
  get(@Param('token') token: string) {
    return this.bookings.getByToken(token);
  }

  @Post('bookings/:token/cancel')
  cancel(@Param('token') token: string) {
    return this.bookings.cancelByToken(token);
  }

  @Post('bookings/:token/refund')
  refund(@Param('token') token: string) {
    return this.bookings.refundByToken(token);
  }
}
