#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugRateLimits() {
  try {
    console.log('🔍 Отладка rate limiting...\n');
    
    // Получаем все записи rate limiting
    const rateLimits = await prisma.rateLimit.findMany({
      orderBy: { windowStartsAt: 'desc' }
    });
    
    console.log(`📊 Всего записей: ${rateLimits.length}\n`);
    
    if (rateLimits.length === 0) {
      console.log('✅ Нет активных rate limiting записей');
      return;
    }
    
    rateLimits.forEach((limit, index) => {
      console.log(`📝 Запись ${index + 1}:`);
      console.log(`   Ключ: ${limit.key}`);
      console.log(`   Счетчик: ${limit.count}`);
      console.log(`   Окно начинается: ${limit.windowStartsAt}`);
      console.log(`   Окно заканчивается: ${limit.windowEndsAt}`);
      console.log(`   Создано: ${limit.windowStartsAt}`);
      
      const now = new Date();
      const windowEnds = new Date(limit.windowEndsAt);
      const isExpired = now > windowEnds;
      
      console.log(`   Окно истекло: ${isExpired ? 'Да' : 'Нет'}`);
      console.log(`   Время до истечения: ${isExpired ? 'Истекло' : Math.round((windowEnds - now) / 1000 / 60) + ' минут'}`);
      console.log('');
    });
    
    // Проверяем настройки из переменных окружения
    console.log('⚙️  Настройки из переменных окружения:');
    console.log(`   RATE_LIMIT_WINDOW: ${process.env.RATE_LIMIT_WINDOW || 'не установлено'}`);
    console.log(`   RATE_LIMIT_MAX_ATTEMPTS: ${process.env.RATE_LIMIT_MAX_ATTEMPTS || 'не установлено'}`);
    
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW || '900000');
    const maxAttempts = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5');
    
    console.log(`   Окно (минуты): ${Math.round(windowMs / 1000 / 60)}`);
    console.log(`   Максимум попыток: ${maxAttempts}`);
    
  } catch (error) {
    console.error('❌ Ошибка при отладке:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRateLimits();
