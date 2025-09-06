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

    // Получаем всех пользователей
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        schoolName: true,
        isEmailVerified: true,
        status: true,
        createdAt: true,
        lastSeenAt: true,
        lastLoginAt: true,
        roles: {
          include: {
            role: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Форматируем данные
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      schoolName: user.schoolName,
      isEmailVerified: user.isEmailVerified,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      lastSeenAt: user.lastSeenAt?.toISOString() || '',
      lastLoginAt: user.lastLoginAt?.toISOString(),
      roles: user.roles.map(ur => ur.role.name)
    }))

    return NextResponse.json({ users: formattedUsers })

  } catch (error) {
    console.error('Ошибка получения пользователей:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
