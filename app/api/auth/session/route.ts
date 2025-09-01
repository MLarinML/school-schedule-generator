import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { JWTManager } from '../../../../lib/auth/jwt'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Получаем токен из cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Верифицируем токен
    const payload = JWTManager.verifyToken(token)
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Сессия истекла или недействительна' },
        { status: 401 }
      )
    }

    // Проверяем, существует ли сессия в базе
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: {
          include: {
            profile: true,
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    })

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Сессия истекла или недействительна' },
        { status: 401 }
      )
    }

    // Обновляем время последнего использования сессии
    await prisma.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() }
    })

    // Получаем роли пользователя
    const roles = session.user.roles.map(ur => ur.role.name)

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.profile?.fullName,
        roles,
        isEmailVerified: session.user.isEmailVerified,
        status: session.user.status,
        lastLoginAt: session.user.lastLoginAt
      },
      session: {
        id: session.id,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        lastSeenAt: session.lastSeenAt,
        ip: session.ip,
        userAgent: session.userAgent
      }
    })

  } catch (error) {
    console.error('Session check error:', error)
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

