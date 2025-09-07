# 🚀 Инструкция по деплою на Vercel

## Быстрый старт

### 1. Подготовка
- Убедитесь, что все изменения закоммичены в Git
- Создайте аккаунт на [Vercel.com](https://vercel.com)

### 2. Деплой через Vercel CLI (рекомендуется)

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите в аккаунт
vercel login

# Деплой
vercel

# Для продакшена
vercel --prod
```

### 3. Деплой через GitHub

1. Загрузите проект на GitHub
2. Подключите репозиторий к Vercel
3. Настройте переменные окружения
4. Деплой автоматически запустится

## Настройка переменных окружения

В панели Vercel добавьте следующие переменные:

### Обязательные:
```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
PASSWORD_PEPPER=your-super-secret-password-pepper
SESSION_SECRET=your-super-secret-session-key
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret
```

### Email (опционально):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com
```

### Платежи (опционально):
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Настройка базы данных

### Вариант 1: Vercel Postgres (рекомендуется)
1. В панели Vercel создайте Postgres базу
2. Скопируйте `DATABASE_URL`
3. Добавьте в переменные окружения

### Вариант 2: Внешняя база данных
- Supabase (бесплатно)
- PlanetScale (бесплатно)
- Railway (бесплатно)

## Миграция базы данных

После деплоя выполните миграции:

```bash
# Подключитесь к продакшен базе
npx prisma migrate deploy

# Создайте админа (опционально)
npx prisma db seed
```

## Домен

### Бесплатный домен Vercel:
- `your-project.vercel.app`

### Собственный домен:
1. Купите домен
2. Добавьте в настройки Vercel
3. Настройте DNS записи

## Мониторинг

- Vercel Analytics (включить в настройках)
- Логи в панели Vercel
- Uptime мониторинг

## Обновления

После каждого коммита в main ветку:
- Автоматический деплой
- Preview для pull requests
- Rollback при ошибках

## Поддержка

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
