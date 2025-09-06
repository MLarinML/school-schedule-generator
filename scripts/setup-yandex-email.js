#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Настройка Yandex Email сервиса\n');

console.log('📋 Инструкция:');
console.log('1. Войдите в свой аккаунт Yandex');
console.log('2. Включите двухфакторную аутентификацию');
console.log('3. Создайте пароль приложения');
console.log('4. Введите данные ниже\n');

const questions = [
  {
    key: 'SMTP_USER',
    question: 'Введите ваш email Yandex (например: vasya@yandex.ru): ',
    validate: (value) => {
      if (!value.includes('@yandex.ru') && !value.includes('@ya.ru')) {
        return 'Email должен быть с доменом @yandex.ru или @ya.ru';
      }
      return true;
    }
  },
  {
    key: 'SMTP_PASS',
    question: 'Введите пароль приложения (16 символов): ',
    validate: (value) => {
      if (value.length !== 16) {
        return 'Пароль приложения должен быть 16 символов';
      }
      return true;
    }
  }
];

let answers = {};

function askQuestion(index) {
  if (index >= questions.length) {
    updateEnvFile();
    return;
  }

  const question = questions[index];
  
  rl.question(question.question, (answer) => {
    const validation = question.validate(answer);
    
    if (validation !== true) {
      console.log(`❌ ${validation}\n`);
      askQuestion(index);
      return;
    }
    
    answers[question.key] = answer;
    askQuestion(index + 1);
  });
}

function updateEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Обновляем настройки
    envContent = envContent.replace(
      /SMTP_USER="[^"]*"/,
      `SMTP_USER="${answers.SMTP_USER}"`
    );
    
    envContent = envContent.replace(
      /SMTP_PASS="[^"]*"/,
      `SMTP_PASS="${answers.SMTP_PASS}"`
    );
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Настройки обновлены!');
    console.log('\n🧪 Тестирование соединения...');
    
    // Тестируем соединение
    testConnection();
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении файла .env:', error.message);
    rl.close();
  }
}

function testConnection() {
  const { exec } = require('child_process');
  
  exec('curl -X POST http://localhost:3001/api/email/test-connection', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Ошибка при тестировании:', error.message);
      console.log('💡 Убедитесь, что сервер запущен: npm run dev');
    } else {
      try {
        const result = JSON.parse(stdout);
        if (result.success) {
          console.log('✅ Email сервис настроен и работает!');
          console.log('🎉 Теперь пользователи могут регистрироваться и получать письма!');
        } else {
          console.log('❌ Email сервис не работает:');
          console.log(result.message);
          if (result.instructions) {
            console.log('\n📋 Инструкции:');
            result.instructions.forEach(instruction => {
              console.log(`   ${instruction}`);
            });
          }
        }
      } catch (parseError) {
        console.log('❌ Ошибка при парсинге ответа:', parseError.message);
        console.log('Ответ сервера:', stdout);
      }
    }
    
    rl.close();
  });
}

// Запускаем процесс
askQuestion(0);
