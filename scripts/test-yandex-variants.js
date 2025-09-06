#!/usr/bin/env node

const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🧪 Тестирование разных вариантов настроек Yandex...\n');

const variants = [
  {
    name: 'Вариант 1: Порт 465 + SSL',
    config: {
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      auth: {
        user: 'umnoeraspisanie@yandex.ru',
        pass: 'FfV-rKh-VSX-3Kr'
      }
    }
  },
  {
    name: 'Вариант 2: Порт 587 + TLS',
    config: {
      host: 'smtp.yandex.ru',
      port: 587,
      secure: false,
      auth: {
        user: 'umnoeraspisanie@yandex.ru',
        pass: 'FfV-rKh-VSX-3Kr'
      }
    }
  },
  {
    name: 'Вариант 3: Порт 465 + SSL + без дефисов',
    config: {
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      auth: {
        user: 'umnoeraspisanie@yandex.ru',
        pass: 'FfVrKhVSX3Kr'
      }
    }
  },
  {
    name: 'Вариант 4: Порт 587 + TLS + без дефисов',
    config: {
      host: 'smtp.yandex.ru',
      port: 587,
      secure: false,
      auth: {
        user: 'umnoeraspisanie@yandex.ru',
        pass: 'FfVrKhVSX3Kr'
      }
    }
  }
];

async function testVariant(variant) {
  return new Promise((resolve) => {
    console.log(`🔍 Тестируем: ${variant.name}`);
    
    const transporter = nodemailer.createTransport(variant.config);
    
    transporter.verify((error, success) => {
      if (error) {
        console.log(`❌ ${variant.name}: ${error.message}`);
        resolve(false);
      } else {
        console.log(`✅ ${variant.name}: Соединение успешно!`);
        resolve(true);
      }
    });
  });
}

async function runTests() {
  let successCount = 0;
  
  for (const variant of variants) {
    const success = await testVariant(variant);
    if (success) successCount++;
    console.log(''); // Пустая строка для разделения
  }
  
  console.log('📊 Результаты:');
  console.log(`✅ Успешных: ${successCount}`);
  console.log(`❌ Неудачных: ${variants.length - successCount}`);
  
  if (successCount === 0) {
    console.log('\n💡 Рекомендации:');
    console.log('1. Проверьте двухфакторную аутентификацию в Yandex');
    console.log('2. Убедитесь, что пароль приложения создан правильно');
    console.log('3. Проверьте, что email адрес корректен');
    console.log('4. Попробуйте создать новый пароль приложения');
    console.log('\n📚 Подробная инструкция: YANDEX_TROUBLESHOOTING.md');
  } else {
    console.log('\n🎉 Найдена рабочая конфигурация!');
    console.log('💡 Обновите файл .env с рабочими настройками');
  }
}

runTests().catch(console.error);
