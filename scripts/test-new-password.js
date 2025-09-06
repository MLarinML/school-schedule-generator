#!/usr/bin/env node

const nodemailer = require('nodemailer');

console.log('🧪 Тестирование нового пароля: 45YqZNRqBM5qWpd\n');

const variants = [
  {
    name: 'Порт 465 + SSL',
    config: {
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      auth: { 
        user: 'umnoeraspisanie@yandex.ru', 
        pass: '45YqZNRqBM5qWpd' 
      }
    }
  },
  {
    name: 'Порт 587 + TLS',
    config: {
      host: 'smtp.yandex.ru',
      port: 587,
      secure: false,
      auth: { 
        user: 'umnoeraspisanie@yandex.ru', 
        pass: '45YqZNRqBM5qWpd' 
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
    console.log('');
  }
  
  console.log('📊 Результаты:');
  console.log(`✅ Успешных: ${successCount}`);
  console.log(`❌ Неудачных: ${variants.length - successCount}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Найдена рабочая конфигурация!');
    console.log('💡 Обновите файл .env с рабочими настройками');
  } else {
    console.log('\n❌ Ни один вариант не работает');
    console.log('💡 Проверьте настройки Yandex аккаунта');
  }
}

runTests().catch(console.error);
