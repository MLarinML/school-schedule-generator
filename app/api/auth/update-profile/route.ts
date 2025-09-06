import { NextRequest, NextResponse } from 'next/server'
import { JWTManager } from '../../../../lib/auth/jwt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Получаем токен из cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Верифицируем токен
    const payload = JWTManager.verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: 'Сессия истекла или недействительна' }, { status: 401 })
    }

    // Проверяем, существует ли сессия в базе
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true }
    })

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Сессия истекла или недействительна' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, schoolName, language } = body

    // Валидация данных
    if (!firstName && !lastName && !schoolName) {
      return NextResponse.json({ error: 'Необходимо заполнить хотя бы одно поле' }, { status: 400 })
    }

    // Обновляем профиль пользователя
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        firstName: firstName || null,
        lastName: lastName || null,
        schoolName: schoolName || null,
        language: language || 'ru',
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        schoolName: true,
        language: true,
        isEmailVerified: true,
        createdAt: true,
        lastSeenAt: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      message: 'Профиль успешно обновлён' 
    })

  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
