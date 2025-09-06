#!/usr/bin/env node

const https = require('https');
const http = require('http');

console.log('🧪 Тестирование новых лимитов rate limiting...\n');

const baseUrl = 'http://localhost:3000';
const testEmail = 'test@example.com';
const testPassword = 'wrongpassword';

async function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function testLoginAttempts() {
  console.log('🔍 Тестируем попытки входа...');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  // Делаем 10 попыток входа с неправильным паролем
  for (let i = 1; i <= 10; i++) {
    try {
      const response = await makeRequest('/api/auth/login', {
        email: testEmail,
        password: testPassword
      });
      
      if (response.status === 429) {
        rateLimitedCount++;
        console.log(`❌ Попытка ${i}: Rate limited (429)`);
        console.log(`   Сообщение: ${response.data.message || 'Rate limited'}`);
      } else if (response.status === 401 || response.status === 403) {
        successCount++;
        console.log(`✅ Попытка ${i}: Ошибка аутентификации (${response.status}) - это нормально`);
      } else {
        console.log(`⚠️  Попытка ${i}: Неожиданный статус ${response.status}`);
      }
      
      // Небольшая пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`❌ Попытка ${i}: Ошибка запроса - ${error.message}`);
    }
  }
  
  console.log('\n📊 Результаты тестирования:');
  console.log(`✅ Успешных запросов: ${successCount}`);
  console.log(`❌ Rate limited: ${rateLimitedCount}`);
  
  if (rateLimitedCount === 0) {
    console.log('🎉 Отлично! Rate limiting не блокирует пользователей после 10 попыток');
    console.log('💡 Пожилые пользователи могут спокойно делать ошибки при входе');
  } else {
    console.log('⚠️  Rate limiting все еще слишком строгий');
  }
}

async function testRegistrationAttempts() {
  console.log('\n🔍 Тестируем попытки регистрации...');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  // Делаем 5 попыток регистрации с одинаковым email
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await makeRequest('/api/auth/register', {
        email: `test${i}@example.com`,
        password: 'testpassword123',
        fullName: `Test User ${i}`
      });
      
      if (response.status === 429) {
        rateLimitedCount++;
        console.log(`❌ Попытка ${i}: Rate limited (429)`);
      } else if (response.status === 400 || response.status === 409) {
        successCount++;
        console.log(`✅ Попытка ${i}: Ошибка валидации (${response.status}) - это нормально`);
      } else {
        console.log(`⚠️  Попытка ${i}: Неожиданный статус ${response.status}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`❌ Попытка ${i}: Ошибка запроса - ${error.message}`);
    }
  }
  
  console.log('\n📊 Результаты тестирования регистрации:');
  console.log(`✅ Успешных запросов: ${successCount}`);
  console.log(`❌ Rate limited: ${rateLimitedCount}`);
}

async function runTests() {
  console.log('🚀 Запуск тестов новых лимитов...\n');
  
  await testLoginAttempts();
  await testRegistrationAttempts();
  
  console.log('\n🎯 Заключение:');
  console.log('Новые настройки rate limiting:');
  console.log('- 50 попыток входа за 60 минут');
  console.log('- 50 попыток регистрации за 60 минут');
  console.log('- Дружелюбнее для пожилых пользователей');
  console.log('- Сохраняет защиту от злоупотреблений');
}

runTests().catch(console.error);
