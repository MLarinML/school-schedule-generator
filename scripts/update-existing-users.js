const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateExistingUsers() {
  try {
    console.log('Обновляем существующих пользователей...')
    
    // Обновляем всех пользователей
    const result = await prisma.user.updateMany({
      data: {
        lastSeenAt: new Date()
      }
    })
    
    console.log(`Обновлено ${result.count} пользователей`)
    
    // Проверяем результат
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        schoolName: true,
        language: true,
        lastSeenAt: true
      }
    })
    
    console.log('Текущие пользователи:')
    users.forEach(user => {
      console.log(`- ${user.email}: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}, школа: ${user.schoolName || 'N/A'}, язык: ${user.language || 'N/A'}, lastSeenAt: ${user.lastSeenAt}`)
    })
    
  } catch (error) {
    console.error('Ошибка при обновлении пользователей:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateExistingUsers()
