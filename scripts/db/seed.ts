import { PrismaClient } from '@prisma/client'
import { PasswordManager } from '../lib/auth/password'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Создаем тестового пользователя
  const hashedPassword = await PasswordManager.hashPassword('TestPassword123')
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      isEmailVerified: true,
      status: 'ACTIVE'
    },
    create: {
      email: 'test@example.com',
      passwordHash: hashedPassword,
      isEmailVerified: true,
      status: 'ACTIVE',
      profile: {
        create: {
          fullName: 'Тест Пользователь',
          locale: 'ru',
          timezone: 'Europe/Moscow'
        }
      }
    },
  })

  console.log('✅ Test user created/updated:', user.email)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
