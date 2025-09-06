import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PasswordManager } from '../../../../lib/auth/password'
import { JWTManager } from '../../../../lib/auth/jwt'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    // Валидация входных данных
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Текущий пароль и новый пароль обязательны' },
        { status: 400 }
      )
    }

    // Валидация нового пароля
    if (newPassword.length < 10) {
      return NextResponse.json(
        { error: 'Новый пароль должен содержать не менее 10 символов' },
        { status: 400 }
      )
    }

    // Получаем токен из cookies
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Проверяем токен
    const payload = JWTManager.verifyToken(token)
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      )
    }

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { profile: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Проверяем текущий пароль
    const isCurrentPasswordValid = await PasswordManager.verifyPassword(
      currentPassword,
      user.passwordHash
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Неверный текущий пароль' },
        { status: 400 }
      )
    }

    // Хешируем новый пароль
    const newPasswordHash = await PasswordManager.hashPassword(newPassword)

    // Обновляем пароль в базе данных
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordUpdatedAt: new Date()
      }
    })

    return NextResponse.json(
      { message: 'Пароль успешно изменён' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Ошибка при смене пароля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
