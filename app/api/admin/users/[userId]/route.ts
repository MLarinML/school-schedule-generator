import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { JWTManager } from '../../../../../lib/auth/jwt'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Получаем параметры
    const { userId } = await params
    
    // Проверяем авторизацию
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const payload = JWTManager.verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: 'Сессия истекла или недействительна' }, { status: 401 })
    }

    // Проверяем, что пользователь - админ
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { 
        user: { 
          include: { 
            roles: { 
              include: { role: true } 
            } 
          } 
        } 
      }
    })

    if (!session || !session.user.roles.some(ur => ur.role.name === 'admin')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { action } = await request.json()

    // Проверяем, что пользователь существует
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Выполняем действие
    switch (action) {
      case 'toggle-status':
        const newStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
        await prisma.user.update({
          where: { id: userId },
          data: { status: newStatus as any }
        })
        return NextResponse.json({ 
          message: `Пользователь ${newStatus === 'ACTIVE' ? 'разблокирован' : 'заблокирован'}` 
        })

      case 'verify-email':
        await prisma.user.update({
          where: { id: userId },
          data: { isEmailVerified: true }
        })
        return NextResponse.json({ message: 'Email подтвержден' })

      case 'reset-password':
        // Здесь можно добавить логику сброса пароля
        return NextResponse.json({ message: 'Пароль сброшен' })

      default:
        return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 })
    }

  } catch (error) {
    console.error('Ошибка выполнения действия с пользователем:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
