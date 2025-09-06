# 🔧 Устранение проблем с Yandex Email

## ❌ **Текущая проблема**
```
Invalid login: 535 5.7.8 Error: authentication failed: Invalid user or password!
```

## 🔍 **Пошаговая диагностика**

### 1. **Проверьте двухфакторную аутентификацию**

1. Войдите в [passport.yandex.ru](https://passport.yandex.ru)
2. Перейдите в "Безопасность"
3. Убедитесь, что **"Двухэтапная аутентификация"** включена
4. Если не включена - включите её

### 2. **Проверьте пароль приложения**

1. В разделе "Безопасность" найдите "Пароли приложений"
2. Убедитесь, что есть пароль для "Генератор расписаний"
3. Если нет - создайте новый:
   - Нажмите "Создать пароль"
   - Название: "Генератор расписаний"
   - Скопируйте пароль (16 символов)

### 3. **Проверьте правильность пароля**

Пароль должен быть **точно** таким, как показан в Yandex:
- ✅ `FfV-rKh-VSX-3Kr` (с дефисами)
- ❌ `FfVrKhVSX3Kr` (без дефисов)

### 4. **Проверьте email адрес**

Убедитесь, что email адрес правильный:
- ✅ `umnoeraspisanie@yandex.ru`
- Проверьте, что аккаунт активен

### 5. **Попробуйте разные настройки**

#### Вариант 1: Порт 465 (SSL)
```bash
SMTP_HOST="smtp.yandex.ru"
SMTP_PORT=465
SMTP_SECURE=true
```

#### Вариант 2: Порт 587 (TLS)
```bash
SMTP_HOST="smtp.yandex.ru"
SMTP_PORT=587
SMTP_SECURE=false
```

## 🧪 **Тестирование**

После каждого изменения запускайте:
```bash
node scripts/test-smtp-direct.js
```

## 🆘 **Если ничего не помогает**

### 1. **Создайте новый пароль приложения**
- Удалите старый пароль
- Создайте новый с другим названием
- Используйте новый пароль

### 2. **Проверьте настройки Yandex**
- Убедитесь, что SMTP включен в настройках почты
- Проверьте, что нет ограничений по IP

### 3. **Попробуйте другой email**
- Создайте тестовый аккаунт Yandex
- Настройте его с нуля
- Протестируйте на нем

## 📞 **Поддержка Yandex**

Если проблемы продолжаются:
- [Справка Yandex по паролям приложений](https://yandex.ru/support/passport/authorization/app-passwords.html)
- [Настройки SMTP для Yandex](https://yandex.ru/support/mail/mail-clients.html)

## 🔄 **Альтернативные решения**

### 1. **Использовать Gmail**
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
```

### 2. **Использовать Mail.ru**
```bash
SMTP_HOST="smtp.mail.ru"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="your-email@mail.ru"
SMTP_PASS="your-mailru-app-password"
```

### 3. **Использовать профессиональный сервис**
- SendGrid
- Mailgun
- Amazon SES
