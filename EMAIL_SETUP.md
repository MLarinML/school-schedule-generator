# Настройка Email сервиса

## Проблема
При попытке отправки email возникает ошибка:
```
Failed to send email: Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

## Решение

### Для Gmail (рекомендуется)

1. **Включите двухфакторную аутентификацию:**
   - Перейдите в [настройки Google](https://myaccount.google.com/security)
   - Включите "Двухэтапная аутентификация"

2. **Создайте пароль приложения:**
   - В разделе "Безопасность" найдите "Пароли приложений"
   - Выберите "Почта" и "Другое устройство"
   - Введите название: "Генератор расписаний"
   - Скопируйте сгенерированный пароль (16 символов)

3. **Настройте переменные окружения:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   SMTP_FROM=noreply@yourdomain.com
   ```

### Для Yandex

1. **Включите двухфакторную аутентификацию**
2. **Создайте пароль приложения**
3. **Настройте переменные окружения:**
   ```bash
   SMTP_HOST=smtp.yandex.ru
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-email@yandex.ru
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@yourdomain.com
   ```

### Для Mail.ru

1. **Включите двухфакторную аутентификацию**
2. **Создайте пароль приложения**
3. **Настройте переменные окружения:**
   ```bash
   SMTP_HOST=smtp.mail.ru
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-email@mail.ru
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@yourdomain.com
   ```

## Важные замечания

- **НЕ используйте обычный пароль от email** - только пароль приложения
- **Пароль приложения** - это специальный 16-символьный код для приложений
- **SMTP_FROM** должен быть валидным email адресом
- **SMTP_SECURE** должен быть `true` для портов 465, `false` для портов 587

## Тестирование

После настройки перезапустите сервер и попробуйте зарегистрировать нового пользователя. Email должен отправиться без ошибок.

## Альтернативные решения

Если проблемы продолжаются, рассмотрите использование:
- **SendGrid** - профессиональный email сервис
- **Mailgun** - надежный email API
- **Amazon SES** - масштабируемый email сервис