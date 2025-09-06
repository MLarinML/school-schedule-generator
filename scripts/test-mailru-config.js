#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Тестирование конфигурации Mail.ru email...\n');

// Проверяем файл .env
const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ Файл .env не найден');
  console.log('💡 Создайте файл .env на основе env.example');
  process.exit(1);
}

// Читаем .env файл
const envContent = fs.readFileSync(envPath, 'utf8');

// Проверяем настройки Mail.ru
const checks = [
  {
    name: 'SMTP_HOST',
    pattern: /SMTP_HOST="([^"]+)"/,
    expected: 'smtp.yandex.ru',
    description: 'SMTP хост'
  },
  {
    name: 'SMTP_PORT',
    pattern: /SMTP_PORT=(\d+)/,
    expected: '587',
    description: 'SMTP порт'
  },
  {
    name: 'SMTP_SECURE',
    pattern: /SMTP_SECURE=(true|false)/,
    expected: 'false',
    description: 'SMTP безопасность'
  },
  {
    name: 'SMTP_USER',
    pattern: /SMTP_USER="([^"]+)"/,
    expected: 'your-email@mail.ru',
    description: 'SMTP пользователь'
  },
  {
    name: 'SMTP_PASS',
    pattern: /SMTP_PASS="([^"]+)"/,
    expected: 'your-mailru-app-password',
    description: 'SMTP пароль'
  }
];

let allPassed = true;

console.log('📋 Проверка настроек:\n');

checks.forEach(check => {
  const match = envContent.match(check.pattern);
  
  if (!match) {
    console.log(`❌ ${check.name}: не найден`);
    allPassed = false;
    return;
  }
  
  const value = match[1];
  const isDefault = value === check.expected;
  
  if (isDefault) {
    console.log(`⚠️  ${check.name}: ${value} (нужно заменить на реальные данные)`);
    allPassed = false;
  } else {
    console.log(`✅ ${check.name}: ${value}`);
  }
});

console.log('\n📊 Результат:');

if (allPassed) {
  console.log('✅ Все настройки корректны!');
  console.log('🧪 Тестируем соединение...');
  
  // Тестируем соединение
  const { exec } = require('child_process');
  
  exec('curl -X POST http://localhost:3000/api/email/test-connection', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Ошибка при тестировании:', error.message);
      console.log('💡 Убедитесь, что сервер запущен: npm run dev');
    } else {
      try {
        const result = JSON.parse(stdout);
        if (result.success) {
          console.log('🎉 Mail.ru email сервис работает отлично!');
        } else {
          console.log('❌ Mail.ru email сервис не работает:');
          console.log(result.message);
        }
      } catch (parseError) {
        console.log('❌ Ошибка при парсинге ответа:', parseError.message);
      }
    }
  });
  
} else {
  console.log('❌ Некоторые настройки требуют внимания');
  console.log('\n💡 Проверьте настройки в .env файле');
}
