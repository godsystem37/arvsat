import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { AddCommentDto } from './dto/add-comment.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller('admin/bookings')
@UseGuards(JwtAuthGuard)
export class AdminBookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  list(
    @Query('offerId') offerId?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    return this.bookings.listAdmin({ offerId, status, q });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.bookings.getAdmin(id);
  }

  @Patch(':id')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookings.updateStatus(id, dto.status);
  }

  @Post(':id/comments')
  comment(@Param('id') id: string, @Body() dto: AddCommentDto) {
    return this.bookings.addComment(id, dto.body);
  }
}
