# AB AI Task

Минимальный проект на `Next.js + TypeScript + Prisma + PostgreSQL` для обработки обращений на перевод ребёнка между спортивными центрами.

- `POST /api/appeals/[id]/transfer`
- парсинг структурированного блока из `Appeal.message`
- поиск текущего и целевого спортивных центров
- поиск программы в целевом центре с доступным местом
- перенос каждого ребёнка независимо от остальных
- закрытие обращения со статусом `RESOLVED`, только если переведены все дети
- ответ в формате `{ success, allTransferred, results }`

## Логика решения

1. Роут загружает обращение и проверяет, что это `CHANGE_PROVIDER`.
2. Из `message` извлекаются email родителя, id текущего и целевого поставщика, а также вид спорта.
3. Для каждого ребёнка:
   - находится `AthleteProfile` по `childIin`
   - ищется `APPROVED` enrollment у текущего поставщика
   - ищется программа у целевого поставщика, где число `APPROVED` и `PENDING` enrollment меньше `capacity`
   - у найденного enrollment обновляются `sportsCenterId` и `programId`
   - статус enrollment переводится в `PENDING`
4. Если все дети обработаны успешно, обращение переводится в `RESOLVED`.

Ошибки обрабатываются независимо по каждому ребёнку, поэтому неудача по одному ребёнку не мешает обработке остальных.

## Запуск

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env`:

```bash
cp .env.example .env
```

3. Поднять PostgreSQL и указать `DATABASE_URL`.

4. Сгенерировать Prisma client и применить миграцию:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. При необходимости заполнить тестовыми данными:

```bash
npm run prisma:seed
```

6. Запустить проект:

```bash
npm run dev
```

## Пример запроса

```bash
curl -X POST http://localhost:3000/api/appeals/<appeal-id>/transfer
```

## Структура

- `src/app/api/appeals/[id]/transfer/route.ts` — HTTP-роут
- `src/lib/transfer.ts` — бизнес-логика перевода
- `prisma/schema.prisma` — схема БД
- `prisma/seed.ts` — тестовые данные

## Ограничения и допущения

- Проект сделан с нуля, поэтому схема БД минимально достаточная под задачу.
- При полном провале всех переводов API возвращает `success: false`; при частичном успехе `success: true`, а `allTransferred: false`.
