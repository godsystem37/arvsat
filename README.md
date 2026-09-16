# Сбор

Каталог офферов, заявки без пароля и админка для работы с людьми. Оплату в этом MVP не подключаем: человек оставляет заявку, получает ссылку, сам отменяет или просит возврат. Админ видит всех в одном списке.

Стек: **Expo (React Native Web / iOS / Android)** + **Nest.js** + **Prisma / SQLite**.

## Что внутри

- `app/` — публичный сайт и админка (один UI на веб и телефон)
- `api/` — REST API, база, письма в лог (или SMTP, если зададите)

Путь покупателя: каталог → оффер → форма → ссылка на заявку.  
Путь админа: вход → офферы (конструктор полей) → люди (статусы и заметки).

## Запуск локально

Нужны Node 20+ и два терминала.

```bash
# API
cd api
cp .env.example .env   # если файла ещё нет
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

API слушает `http://127.0.0.1:43128`.

```bash
# Сайт
cd app
npm install
npm run web
```

Сайт: `http://127.0.0.1:43127`.

Админ: `admin@sbor.local` / `admin123`.

На телефоне: `cd app && npx expo start`, затем камера на QR в Expo Go. В `app/.env` поставьте `EXPO_PUBLIC_API_URL` на IP компьютера в сети, не localhost.

## Письма

Если в заявке есть почта, API пишет письмо в лог (тема, код, ссылка). Чтобы отправлять по-настоящему, позже добавьте SMTP в `api/.env`. SMS нет.

## База

Сейчас SQLite: `api/prisma/dev.db`. На Postgres позже смените `provider` и `DATABASE_URL` в `prisma/schema.prisma` и сделайте `prisma migrate dev`.

## Что сознательно не сделано

Эквайринг, SMS, магазин приложений, пароль у покупателя, FAQ.
