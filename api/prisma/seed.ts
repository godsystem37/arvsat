import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@sbor.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  const existing = await prisma.offer.count();
  if (existing > 0) {
    return;
  }

  await prisma.offer.create({
    data: {
      title: 'Карелия, выходные на воде',
      price: 18500,
      limit: 8,
      published: true,
      fields: [
        {
          id: 'city',
          label: 'Откуда удобнее выезжать',
          type: 'select',
          required: true,
          options: ['Москва', 'Санкт-Петербург', 'Свой город — напишу в комментарии'],
        },
        {
          id: 'food',
          label: 'Аллергии и питание',
          type: 'textarea',
          required: false,
        },
        {
          id: 'transfer',
          label: 'Нужен трансфер до вокзала',
          type: 'checkbox',
          required: false,
        },
      ],
    },
  });

  await prisma.offer.create({
    data: {
      title: 'Набор открыток «Север»',
      price: 650,
      limit: 30,
      published: true,
      fields: [
        {
          id: 'address',
          label: 'Адрес доставки',
          type: 'textarea',
          required: true,
        },
        {
          id: 'comment',
          label: 'Комментарий к заказу',
          type: 'textarea',
          required: false,
        },
      ],
    },
  });

  await prisma.offer.create({
    data: {
      title: 'Новый маршрут — черновик',
      price: 0,
      limit: 10,
      published: false,
      fields: [],
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
