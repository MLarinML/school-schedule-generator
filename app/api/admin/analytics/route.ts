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

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    // Вычисляем даты для фильтрации
    const now = new Date()
    const startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Получаем статистику
    const [
      totalUsers,
      newUsersThisMonth,
      activeUsers,
      userGrowth,
      revenueGrowth,
      topPlans
    ] = await Promise.all([
      // Всего пользователей
      prisma.user.count(),
      
      // Новых пользователей за месяц
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        }
      }),
      
      // Активных пользователей за период
      prisma.user.count({
        where: {
          lastSeenAt: {
            gte: startDate
          }
        }
      }),
      
      // Рост пользователей по месяцам (заглушка)
      [],
      
      // Рост доходов по месяцам (заглушка)
      [],
      
      // Популярные планы (заглушка)
      []
    ])

    // Вычисляем конверсию
    const conversionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0

    return NextResponse.json({
      totalUsers,
      newUsersThisMonth,
      activeUsers,
      totalRevenue: 0, // Заглушка
      monthlyRevenue: 0, // Заглушка
      userGrowth,
      revenueGrowth,
      topPlans,
      conversionRate: Math.round(conversionRate)
    })

  } catch (error) {
    console.error('Ошибка получения аналитики:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
