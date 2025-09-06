#!/usr/bin/env node

const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🧪 Прямое тестирование SMTP соединения с Yandex...\n');

// Показываем настройки (без пароля)
console.log('📋 Текущие настройки:');
console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);
console.log(`SMTP_SECURE: ${process.env.SMTP_SECURE}`);
console.log(`SMTP_USER: ${process.env.SMTP_USER}`);
console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '***установлен***' : 'НЕ УСТАНОВЛЕН'}`);
console.log(`SMTP_FROM: ${process.env.SMTP_FROM}\n`);

// Создаем транспортер
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log('🔌 Тестируем соединение...');

// Тестируем соединение
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Ошибка соединения:');
    console.log(error.message);
    
    if (error.message.includes('535')) {
      console.log('\n💡 Возможные причины:');
      console.log('1. Неправильный пароль приложения');
      console.log('2. Двухфакторная аутентификация не включена');
      console.log('3. Пароль приложения не создан');
      console.log('4. Неправильный email адрес');
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Возможные причины:');
      console.log('1. Неправильный хост или порт');
      console.log('2. Проблемы с интернет соединением');
      console.log('3. Блокировка файрволом');
    }
    
  } else {
    console.log('✅ Соединение успешно!');
    console.log('🎉 Email сервис готов к работе!');
    
    // Тестируем отправку письма
    console.log('\n📧 Тестируем отправку письма...');
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER, // Отправляем себе
      subject: 'Тест настройки email сервиса',
      text: 'Это тестовое письмо для проверки настройки email сервиса.',
      html: '<p>Это тестовое письмо для проверки настройки email сервиса.</p>'
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('❌ Ошибка отправки письма:', error.message);
      } else {
        console.log('✅ Письмо отправлено успешно!');
        console.log('📬 Проверьте почту:', process.env.SMTP_USER);
      }
    });
  }
});
