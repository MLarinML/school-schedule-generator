const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createAdminRole() {
  try {
    console.log('Создаем роль администратора...')
    
    // Создаем роль администратора
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Администратор системы'
      }
    })
    
    console.log('Роль администратора создана:', adminRole)
    
    // Находим пользователя по email (замените на нужный email)
    const userEmail = 'testuser@example.com' // Замените на email админа
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })
    
    if (!user) {
      console.log(`Пользователь с email ${userEmail} не найден`)
      console.log('Доступные пользователи:')
      const users = await prisma.user.findMany({
        select: { id: true, email: true, firstName: true, lastName: true }
      })
      users.forEach(u => {
        console.log(`- ${u.email} (${u.firstName || ''} ${u.lastName || ''})`)
      })
      return
    }
    
    // Назначаем роль администратора пользователю
    const userRole = await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: adminRole.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: adminRole.id
      }
    })
    
    console.log('Роль администратора назначена пользователю:', userRole)
    console.log(`Пользователь ${userEmail} теперь является администратором`)
    
  } catch (error) {
    console.error('Ошибка создания роли администратора:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminRole()
