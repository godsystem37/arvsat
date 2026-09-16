import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { parseFields, validateAnswers } from '../offers/field-schema';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

const ACTIVE_STATUSES = ['new', 'confirmed', 'refund_requested'];

function makeToken() {
  return randomBytes(24).toString('hex');
}

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return `СБ-${out}`;
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private publicUrl(token: string) {
    const base = this.config
      .get<string>('PUBLIC_APP_URL', 'http://127.0.0.1:43127')
      .replace(/\/$/, '');
    return `${base}/b/${token}`;
  }

  private serialize(booking: {
    answers: unknown;
    offer: { fields: unknown; title: string; price: number; id: string };
    comments?: { id: string; body: string; createdAt: Date }[];
    token: string;
    code: string;
    id: string;
    name: string;
    phone: string;
    email: string | null;
    quantity: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    offerId: string;
  }) {
    return {
      id: booking.id,
      token: booking.token,
      code: booking.code,
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      quantity: booking.quantity,
      answers: booking.answers,
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      url: this.publicUrl(booking.token),
      offer: {
        id: booking.offer.id,
        title: booking.offer.title,
        price: booking.offer.price,
        fields: parseFields(booking.offer.fields),
      },
      comments: booking.comments ?? [],
    };
  }

  async create(offerId: string, dto: CreateBookingDto) {
    const quantity = dto.quantity ?? 1;
    const name = dto.name.trim();
    const phone = dto.phone.trim();
    const email = dto.email?.trim().toLowerCase() || null;

    if (!name || !phone) {
      throw new BadRequestException('Укажите имя и телефон');
    }

    const booking = await this.prisma.$transaction(async (tx) => {
      const offer = await tx.offer.findUnique({ where: { id: offerId } });
      if (!offer || !offer.published) {
        throw new NotFoundException('Оффер не найден');
      }

      const used = await tx.booking.aggregate({
        where: { offerId, status: { not: 'cancelled' } },
        _sum: { quantity: true },
      });
      const remaining = offer.limit - (used._sum.quantity ?? 0);
      if (quantity > remaining) {
        throw new ConflictException(
          remaining <= 0
            ? 'Мест больше нет'
            : `Осталось только ${remaining} мест`,
        );
      }

      let answers: Record<string, unknown>;
      try {
        answers = validateAnswers(parseFields(offer.fields), dto.answers);
      } catch (err) {
        throw new BadRequestException(
          err instanceof Error ? err.message : 'Проверьте поля формы',
        );
      }

      return tx.booking.create({
        data: {
          token: makeToken(),
          code: makeCode(),
          offerId,
          name,
          phone,
          email,
          quantity,
          answers: answers as Prisma.InputJsonValue,
          status: 'new',
        },
        include: { offer: true, comments: true },
      });
    });

    if (email) {
      await this.mail.sendBookingLink({
        to: email,
        offerTitle: booking.offer.title,
        code: booking.code,
        url: this.publicUrl(booking.token),
      });
    }

    return this.serialize(booking);
  }

  async getByToken(token: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { token },
      include: { offer: true, comments: false },
    });
    if (!booking) {
      throw new NotFoundException('Заявка не найдена');
    }
    return this.serialize({ ...booking, comments: [] });
  }

  async cancelByToken(token: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { token },
      include: { offer: true, comments: true },
    });
    if (!booking) {
      throw new NotFoundException('Заявка не найдена');
    }
    if (booking.status === 'cancelled') {
      throw new BadRequestException('Заявка уже отменена');
    }
    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'cancelled' },
      include: { offer: true, comments: true },
    });
    return this.serialize(updated);
  }

  async refundByToken(token: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { token },
      include: { offer: true, comments: true },
    });
    if (!booking) {
      throw new NotFoundException('Заявка не найдена');
    }
    if (booking.status === 'cancelled') {
      throw new BadRequestException('Отменённую заявку нельзя вернуть');
    }
    if (booking.status === 'refund_requested') {
      return this.serialize(booking);
    }
    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'refund_requested' },
      include: { offer: true, comments: true },
    });
    return this.serialize(updated);
  }

  async listAdmin(query: { offerId?: string; status?: string; q?: string }) {
    const where: Prisma.BookingWhereInput = {};
    if (query.offerId) where.offerId = query.offerId;
    if (query.status) where.status = query.status;
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { code: { contains: q } },
      ];
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: { offer: true, comments: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return bookings.map((b) => this.serialize(b));
  }

  async getAdmin(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { offer: true, comments: { orderBy: { createdAt: 'asc' } } },
    });
    if (!booking) {
      throw new NotFoundException('Заявка не найдена');
    }
    return this.serialize(booking);
  }

  async updateStatus(id: string, status: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Заявка не найдена');
    }
    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status },
      include: { offer: true, comments: { orderBy: { createdAt: 'asc' } } },
    });
    return this.serialize(updated);
  }

  async addComment(id: string, body: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Заявка не найдена');
    }
    const text = body.trim();
    if (!text) {
      throw new BadRequestException('Комментарий пустой');
    }
    await this.prisma.bookingComment.create({
      data: { bookingId: id, body: text },
    });
    return this.getAdmin(id);
  }

  activeStatuses() {
    return ACTIVE_STATUSES;
  }
}
