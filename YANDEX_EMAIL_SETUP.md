# 📧 Настройка Yandex для email сервиса

## 🎯 **Пошаговая инструкция**

### 1. **Войдите в свой аккаунт Yandex**
- Перейдите на [yandex.ru](https://yandex.ru)
- Войдите в свой аккаунт

### 2. **Включите двухфакторную аутентификацию**
- Перейдите в [Настройки безопасности](https://passport.yandex.ru/profile)
- В разделе "Безопасность" найдите "Двухфакторная аутентификация"
- Включите её, следуя инструкциям

### 3. **Создайте пароль приложения**
- В разделе "Безопасность" найдите "Пароли приложений"
- Нажмите "Создать пароль"
- Введите название: "Генератор расписаний"
- Скопируйте сгенерированный пароль (16 символов)

### 4. **Обновите файл .env**
Замените в файле `.env` следующие строки:

```bash
# Замените на ваш реальный email
SMTP_USER="your-email@yandex.ru"

# Замените на пароль приложения (16 символов)
SMTP_PASS="your-16-character-app-password"
```

### 5. **Пример правильных настроек**
```bash
SMTP_HOST="smtp.yandex.ru"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="vasya.pupkin@yandex.ru"
SMTP_PASS="abcdefghijklmnop"
SMTP_FROM="noreply@raspisanie.ru"
```

## ⚠️ **Важные замечания**

- **НЕ используйте обычный пароль** от Yandex - только пароль приложения
- **Пароль приложения** - это специальный 16-символьный код
- **SMTP_SECURE=true** для порта 465 (обязательно!)
- **SMTP_FROM** должен быть валидным email адресом

## 🧪 **Тестирование**

После настройки протестируйте соединение:

```bash
curl -X POST http://localhost:3001/api/email/test-connection
```

Успешный ответ:
```json
{
  "success": true,
  "message": "Email service is configured and working correctly"
}
```

## 🔧 **Альтернативные настройки**

### Для других доменов Yandex:
- `@ya.ru` - работает так же
- `@yandex.com` - работает так же
- `@yandex.by` - работает так же

### Если не работает порт 465:
```bash
SMTP_HOST="smtp.yandex.ru"
SMTP_PORT=587
SMTP_SECURE=false
```

## 🆘 **Решение проблем**

### Ошибка "Invalid login"
- Проверьте, что включена двухфакторная аутентификация
- Убедитесь, что используете пароль приложения, а не обычный пароль
- Проверьте правильность email адреса

### Ошибка "Connection timeout"
- Проверьте настройки файрвола
- Убедитесь, что порт 465 не заблокирован

### Ошибка "SSL/TLS"
- Убедитесь, что `SMTP_SECURE=true` для порта 465
- Или `SMTP_SECURE=false` для порта 587

## 📞 **Поддержка**

Если проблемы продолжаются:
- [Справка Yandex по паролям приложений](https://yandex.ru/support/passport/authorization/app-passwords.html)
- [Настройки SMTP для Yandex](https://yandex.ru/support/mail/mail-clients.html)
