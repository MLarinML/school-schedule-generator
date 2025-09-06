import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { JWTManager } from '../../../../lib/auth/jwt'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
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

    // Получаем статистику
    const [
      totalUsers,
      activeUsers
    ] = await Promise.all([
      // Всего пользователей
      prisma.user.count(),
      
      // Активных пользователей (за последние 30 дней)
      prisma.user.count({
        where: {
          lastSeenAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    // Заглушки для подписок и email (пока не реализованы)
    const totalSubscriptions = 0
    const activeSubscriptions = 0
    const monthlyRevenue = 0
    const pendingVerifications = 0

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalSubscriptions,
      activeSubscriptions,
      monthlyRevenue,
      pendingVerifications
    })

  } catch (error) {
    console.error('Ошибка получения статистики:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
