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
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OffersService } from './offers.service';

@Controller('admin/offers')
@UseGuards(JwtAuthGuard)
export class AdminOffersController {
  constructor(private readonly offers: OffersService) {}

  @Get()
  list(@Query('archived') archived?: string) {
    if (archived === 'all') return this.offers.listAdmin('all');
    return this.offers.listAdmin(archived === '1' || archived === 'true');
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.offers.getAdmin(id);
  }

  @Post()
  create(@Body() dto: CreateOfferDto) {
    return this.offers.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOfferDto) {
    return this.offers.update(id, dto);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.offers.archive(id);
  }

  @Post(':id/unarchive')
  unarchive(@Param('id') id: string) {
    return this.offers.unarchive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.offers.remove(id);
  }
}
