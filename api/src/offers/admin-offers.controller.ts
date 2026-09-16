import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
  list() {
    return this.offers.listAdmin();
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
}
