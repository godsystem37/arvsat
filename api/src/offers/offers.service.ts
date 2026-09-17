import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { parseFields, sanitizeFields } from './field-schema';

const LIVE_STATUSES = ['new', 'confirmed', 'refund_requested'];

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

  private async bookingCounts(offerIds: string[]) {
    if (offerIds.length === 0) {
      return {
        total: new Map<string, number>(),
        live: new Map<string, number>(),
      };
    }
    const [all, live] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['offerId'],
        where: { offerId: { in: offerIds } },
        _count: { _all: true },
      }),
      this.prisma.booking.groupBy({
        by: ['offerId'],
        where: { offerId: { in: offerIds }, status: { in: LIVE_STATUSES } },
        _count: { _all: true },
      }),
    ]);
    return {
      total: new Map(all.map((row) => [row.offerId, row._count._all])),
      live: new Map(live.map((row) => [row.offerId, row._count._all])),
    };
  }

  private withMeta<T extends { id: string; fields: unknown; published: boolean }>(
    offer: T,
    remaining: number,
    total = 0,
    live = 0,
  ) {
    return {
      ...offer,
      fields: parseFields(offer.fields),
      remaining,
      totalBookings: total,
      liveBookings: live,
      archived: !offer.published && total > 0 && live === 0,
    };
  }

  async listPublic() {
    const offers = await this.prisma.offer.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });
    const remaining = await this.remainingMap(offers.map((o) => o.id));
    const counts = await this.bookingCounts(offers.map((o) => o.id));
    return offers.map((offer) =>
      this.withMeta(
        offer,
        remaining.get(offer.id) ?? 0,
        counts.total.get(offer.id) ?? 0,
        counts.live.get(offer.id) ?? 0,
      ),
    );
  }

  async getPublic(id: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer || !offer.published) {
      throw new NotFoundException('Оффер не найден');
    }
    const remaining = await this.remainingFor(offer.id);
    const counts = await this.bookingCounts([offer.id]);
    return this.withMeta(
      offer,
      remaining,
      counts.total.get(offer.id) ?? 0,
      counts.live.get(offer.id) ?? 0,
    );
  }

  async listAdmin(archived: boolean | 'all' = false) {
    const offers = await this.prisma.offer.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    const ids = offers.map((o) => o.id);
    const remaining = await this.remainingMap(ids);
    const counts = await this.bookingCounts(ids);
    const result = offers.map((offer) =>
      this.withMeta(
        offer,
        remaining.get(offer.id) ?? 0,
        counts.total.get(offer.id) ?? 0,
        counts.live.get(offer.id) ?? 0,
      ),
    );
    if (archived === 'all') return result;
    return result.filter((offer) => offer.archived === archived);
  }

  async getAdmin(id: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) {
      throw new NotFoundException('Оффер не найден');
    }
    const remaining = await this.remainingFor(offer.id);
    const counts = await this.bookingCounts([id]);
    return this.withMeta(
      offer,
      remaining,
      counts.total.get(id) ?? 0,
      counts.live.get(id) ?? 0,
    );
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
    return this.withMeta(offer, offer.limit, 0, 0);
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
    const counts = await this.bookingCounts([offer.id]);
    return this.withMeta(
      offer,
      remaining,
      counts.total.get(offer.id) ?? 0,
      counts.live.get(offer.id) ?? 0,
    );
  }

  async archive(id: string) {
    const existing = await this.prisma.offer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Событие не найдено');
    }
    const live = await this.prisma.booking.count({
      where: {
        offerId: id,
        status: { in: LIVE_STATUSES },
      },
    });
    if (live > 0) {
      throw new ConflictException(
        `Нельзя снять: ещё ${live} живых заявок. Отметьте людей выполненными — потом событие уйдёт в историю, а покупателей можно найти поиском.`,
      );
    }
    const total = await this.prisma.booking.count({ where: { offerId: id } });
    if (total === 0) {
      throw new ConflictException('Пустой черновик лучше удалить, а не снимать в историю.');
    }
    const offer = await this.prisma.offer.update({
      where: { id },
      data: { published: false },
    });
    const remaining = await this.remainingFor(offer.id);
    return this.withMeta(offer, remaining, total, 0);
  }

  async unarchive(id: string) {
    const existing = await this.prisma.offer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Событие не найдено');
    }
    const offer = await this.prisma.offer.update({
      where: { id },
      data: { published: true },
    });
    const remaining = await this.remainingFor(offer.id);
    const counts = await this.bookingCounts([id]);
    return this.withMeta(
      offer,
      remaining,
      counts.total.get(id) ?? 0,
      counts.live.get(id) ?? 0,
    );
  }

  async remove(id: string) {
    const existing = await this.prisma.offer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Событие не найдено');
    }
    const bookings = await this.prisma.booking.count({ where: { offerId: id } });
    if (bookings > 0) {
      throw new ConflictException(
        `Нельзя удалить: есть ${bookings} заявок. Отметьте людей выполненными и снимите событие в историю — карточки сохранятся.`,
      );
    }
    await this.prisma.offer.delete({ where: { id } });
    return { ok: true };
  }
}
