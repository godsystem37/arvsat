import { Controller, Get, Param } from '@nestjs/common';
import { OffersService } from './offers.service';

@Controller('offers')
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get()
  list() {
    return this.offers.listPublic();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.offers.getPublic(id);
  }
}
