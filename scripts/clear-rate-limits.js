#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearRateLimits() {
  try {
    console.log('🧹 Очистка rate limiting записей...\n');
    
    // Получаем количество записей до очистки
    const beforeCount = await prisma.rateLimit.count();
    console.log(`📊 Записей до очистки: ${beforeCount}`);
    
    if (beforeCount === 0) {
      console.log('✅ База данных уже чистая');
      return;
    }
    
    // Удаляем все записи rate limiting
    const result = await prisma.rateLimit.deleteMany({});
    
    console.log(`🗑️  Удалено записей: ${result.count}`);
    console.log('✅ Rate limiting записи очищены');
    console.log('\n💡 Теперь пользователи могут снова делать попытки входа');
    console.log('🎯 Новые лимиты: 50 попыток за 60 минут');
    
  } catch (error) {
    console.error('❌ Ошибка при очистке rate limiting:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearRateLimits();
