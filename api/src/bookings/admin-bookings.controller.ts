import {
  Body,
  Controller,
  Delete,
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
import { BulkUpdateStatusDto } from './dto/bulk-update-status.dto';
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
    @Query('scope') scope?: string,
  ) {
    return this.bookings.listAdmin({ offerId, status, q, scope });
  }

  @Patch('bulk')
  updateStatusBulk(@Body() dto: BulkUpdateStatusDto) {
    return this.bookings.updateStatusMany(dto.ids, dto.status);
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

  @Patch(':id/comments/:commentId')
  updateComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() dto: AddCommentDto,
  ) {
    return this.bookings.updateComment(id, commentId, dto.body);
  }

  @Delete(':id/comments/:commentId')
  removeComment(@Param('id') id: string, @Param('commentId') commentId: string) {
    return this.bookings.removeComment(id, commentId);
  }
}
