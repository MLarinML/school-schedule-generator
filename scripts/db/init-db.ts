import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Инициализация базы данных...')

  try {
    // Создаем базовые роли
    console.log('📝 Создание базовых ролей...')
    
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Администратор системы с полными правами'
      }
    })

    const staffRole = await prisma.role.upsert({
      where: { name: 'staff' },
      update: {},
      create: {
        name: 'staff',
        description: 'Сотрудник с расширенными правами'
      }
    })

    const viewerRole = await prisma.role.upsert({
      where: { name: 'viewer' },
      update: {},
      create: {
        name: 'viewer',
        description: 'Пользователь с базовыми правами просмотра'
      }
    })

    console.log('✅ Роли созданы:', { adminRole, staffRole, viewerRole })

    // Создаем тестового администратора (только для разработки)
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 Создание тестового администратора...')
      
      const adminEmail = 'admin@raspisanie.ru'
      const adminPassword = 'Admin123!@#'
      
      // Проверяем, существует ли уже администратор
      const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
      })

      if (!existingAdmin) {
        // В реальном проекте здесь нужно использовать PasswordManager
        const adminUser = await prisma.user.create({
          data: {
            email: adminEmail,
            passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8HqHqKq', // Admin123!@#
            passwordAlgo: 'bcrypt',
            isEmailVerified: true,
            status: 'ACTIVE'
          }
        })

        // Создаем профиль
        await prisma.userProfile.create({
          data: {
            userId: adminUser.id,
            fullName: 'Администратор системы',
            locale: 'ru',
            timezone: 'Europe/Moscow'
          }
        })

        // Назначаем роль администратора
        await prisma.userRole.create({
          data: {
            userId: adminUser.id,
            roleId: adminRole.id
          }
        })

        console.log('✅ Тестовый администратор создан:', adminUser.email)
        console.log('🔑 Логин: admin@raspisanie.ru')
        console.log('🔑 Пароль: Admin123!@#')
      } else {
        console.log('ℹ️ Тестовый администратор уже существует')
      }
    }

    console.log('🎉 Инициализация базы данных завершена успешно!')

  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
