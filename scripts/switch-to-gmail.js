#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Переключение на Gmail Email сервис\n');

console.log('📋 Инструкция для Gmail:');
console.log('1. Войдите в свой аккаунт Google');
console.log('2. Включите двухфакторную аутентификацию');
console.log('3. Создайте пароль приложения');
console.log('4. Введите данные ниже\n');

const questions = [
  {
    key: 'SMTP_USER',
    question: 'Введите ваш email Gmail (например: vasya@gmail.com): ',
    validate: (value) => {
      if (!value.includes('@gmail.com')) {
        return 'Email должен быть с доменом @gmail.com';
      }
      return true;
    }
  },
  {
    key: 'SMTP_PASS',
    question: 'Введите пароль приложения Gmail (16 символов): ',
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
    
    // Обновляем настройки для Gmail
    envContent = envContent.replace(
      /SMTP_HOST="[^"]*"/,
      'SMTP_HOST="smtp.gmail.com"'
    );
    
    envContent = envContent.replace(
      /SMTP_PORT=\d+/,
      'SMTP_PORT=587'
    );
    
    envContent = envContent.replace(
      /SMTP_SECURE=(true|false)/,
      'SMTP_SECURE=false'
    );
    
    envContent = envContent.replace(
      /SMTP_USER="[^"]*"/,
      `SMTP_USER="${answers.SMTP_USER}"`
    );
    
    envContent = envContent.replace(
      /SMTP_PASS="[^"]*"/,
      `SMTP_PASS="${answers.SMTP_PASS}"`
    );
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Настройки обновлены для Gmail!');
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
  
  exec('curl -X POST http://localhost:3000/api/email/test-connection', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Ошибка при тестировании:', error.message);
      console.log('💡 Убедитесь, что сервер запущен: npm run dev');
    } else {
      try {
        const result = JSON.parse(stdout);
        if (result.success) {
          console.log('✅ Gmail сервис настроен и работает!');
          console.log('🎉 Теперь пользователи могут регистрироваться и получать письма!');
        } else {
          console.log('❌ Gmail сервис не работает:');
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
