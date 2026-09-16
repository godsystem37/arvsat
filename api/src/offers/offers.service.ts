import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { parseFields, sanitizeFields } from './field-schema';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async remainingFor(offerId: string): Promise<number> {
    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException('Оффер не найден');
    }
    const used = await this.prisma.booking.aggregate({
      where: { offerId, status: { not: 'cancelled' } },
      _sum: { quantity: true },
    });
    return Math.max(0, offer.limit - (used._sum.quantity ?? 0));
  }

  async remainingMap(offerIds: string[]): Promise<Map<string, number>> {
    if (offerIds.length === 0) {
      return new Map();
    }
    const offers = await this.prisma.offer.findMany({
      where: { id: { in: offerIds } },
      select: { id: true, limit: true },
    });
    const grouped = await this.prisma.booking.groupBy({
      by: ['offerId'],
      where: { offerId: { in: offerIds }, status: { not: 'cancelled' } },
      _sum: { quantity: true },
    });
    const used = new Map(
      grouped.map((row) => [row.offerId, row._sum.quantity ?? 0]),
    );
    return new Map(
      offers.map((offer) => [
        offer.id,
        Math.max(0, offer.limit - (used.get(offer.id) ?? 0)),
      ]),
    );
  }

  private withRemaining<T extends { id: string; fields: unknown }>(
    offer: T,
    remaining: number,
  ) {
    return {
      ...offer,
      fields: parseFields(offer.fields),
      remaining,
    };
  }

  async listPublic() {
    const offers = await this.prisma.offer.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });
    const remaining = await this.remainingMap(offers.map((o) => o.id));
    return offers.map((offer) =>
      this.withRemaining(offer, remaining.get(offer.id) ?? 0),
    );
  }

  async getPublic(id: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer || !offer.published) {
      throw new NotFoundException('Оффер не найден');
    }
    const remaining = await this.remainingFor(offer.id);
    return this.withRemaining(offer, remaining);
  }

  async listAdmin() {
    const offers = await this.prisma.offer.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    const remaining = await this.remainingMap(offers.map((o) => o.id));
    return offers.map((offer) =>
      this.withRemaining(offer, remaining.get(offer.id) ?? 0),
    );
  }

  async getAdmin(id: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) {
      throw new NotFoundException('Оффер не найден');
    }
    const remaining = await this.remainingFor(offer.id);
    return this.withRemaining(offer, remaining);
  }

  async create(dto: CreateOfferDto) {
    const fields = sanitizeFields(dto.fields);
    const offer = await this.prisma.offer.create({
      data: {
        title: dto.title.trim(),
        price: dto.price,
        limit: dto.limit,
        published: Boolean(dto.published),
        fields: fields as Prisma.InputJsonValue,
      },
    });
    return this.withRemaining(offer, offer.limit);
  }

  async update(id: string, dto: UpdateOfferDto) {
    const existing = await this.prisma.offer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Оффер не найден');
    }

    const data: Prisma.OfferUpdateInput = {};
    if (dto.title !== undefined) {
      const title = dto.title.trim();
      if (!title) {
        throw new BadRequestException('Название не может быть пустым');
      }
      data.title = title;
    }
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.limit !== undefined) data.limit = dto.limit;
    if (dto.published !== undefined) data.published = dto.published;
    if (dto.fields !== undefined) {
      data.fields = sanitizeFields(dto.fields) as Prisma.InputJsonValue;
    }

    const offer = await this.prisma.offer.update({ where: { id }, data });
    const remaining = await this.remainingFor(offer.id);
    return this.withRemaining(offer, remaining);
  }
}
