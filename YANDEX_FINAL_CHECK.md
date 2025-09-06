# 🔍 Финальная проверка настроек Yandex

## ❌ **Статус: Пароль не работает**

### 🧪 **Протестированные пароли:**
1. ❌ `FfV-rKh-VSX-3Kr` (с дефисами)
2. ❌ `FfVrKhVSX3Kr` (без дефисов)  
3. ❌ `45YqZNRqBM5qWpd` (новый пароль)

### 🔍 **Что нужно проверить в Yandex:**

#### 1. **Двухфакторная аутентификация**
- Войдите в [passport.yandex.ru](https://passport.yandex.ru)
- Перейдите в "Безопасность"
- Убедитесь, что **"Двухэтапная аутентификация"** включена
- Если не включена - включите её

#### 2. **Пароль приложения**
- В разделе "Безопасность" найдите "Пароли приложений"
- Убедитесь, что есть пароль для "Генератор расписаний"
- Если нет - создайте новый:
  - Нажмите "Создать пароль"
  - Название: "Генератор расписаний"
  - Скопируйте пароль (16 символов)

#### 3. **Настройки почты**
- Проверьте, что SMTP включен в настройках почты
- Убедитесь, что нет ограничений по IP

## 🚀 **Альтернативные решения:**

### Вариант 1: Gmail (рекомендуется)
```bash
# Создайте Gmail аккаунт и настройте App Password
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
```

### Вариант 2: Mail.ru
```bash
# Создайте Mail.ru аккаунт и настройте App Password
SMTP_HOST="smtp.mail.ru"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="your-email@mail.ru"
SMTP_PASS="your-mailru-app-password"
```

### Вариант 3: Временное решение
Можно временно отключить email сервис и тестировать без него:

```bash
# В .env файле закомментируйте SMTP настройки
# SMTP_HOST="smtp.yandex.ru"
# SMTP_PORT=465
# SMTP_SECURE=true
# SMTP_USER="umnoeraspisanie@yandex.ru"
# SMTP_PASS="45YqZNRqBM5qWpd"
```

## 🧪 **После исправления:**

1. **Протестируйте соединение:**
   ```bash
   node scripts/test-smtp-direct.js
   ```

2. **Протестируйте через API:**
   ```bash
   curl -X POST http://localhost:3000/api/email/test-connection
   ```

3. **Проверьте регистрацию:**
   - Откройте http://localhost:3000
   - Попробуйте зарегистрироваться
   - Проверьте, приходит ли письмо

## 📞 **Поддержка Yandex:**

Если проблемы продолжаются:
- [Справка Yandex по паролям приложений](https://yandex.ru/support/passport/authorization/app-passwords.html)
- [Настройки SMTP для Yandex](https://yandex.ru/support/mail/mail-clients.html)

## 🎯 **Цель:**
Получить ответ `{"success": true}` при тестировании соединения.

---

**Последнее обновление:** $(date)
