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

    // Получаем все активные сессии пользователя
    const sessions = await prisma.session.findMany({
      where: { 
        userId: payload.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastSeenAt: 'desc' }
    })

    // Форматируем данные сессий
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastSeenAt: session.lastSeenAt,
      ip: session.ip,
      userAgent: session.userAgent,
      isCurrent: session.id === payload.sessionId
    }))

    return NextResponse.json({
      sessions: formattedSessions,
      total: formattedSessions.length
    })

  } catch (error) {
    console.error('Sessions list error:', error)
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID сессии не указан' },
        { status: 400 }
      )
    }

    // Проверяем, что сессия принадлежит пользователю
    const session = await prisma.session.findFirst({
      where: { 
        id: sessionId,
        userId: payload.userId,
        isRevoked: false
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      )
    }

    // Нельзя завершить текущую сессию через этот эндпоинт
    if (sessionId === payload.sessionId) {
      return NextResponse.json(
        { error: 'Нельзя завершить текущую сессию' },
        { status: 400 }
      )
    }

    // Помечаем сессию как отозванную
    await prisma.session.update({
      where: { id: sessionId },
      data: { 
        isRevoked: true,
        lastSeenAt: new Date()
      }
    })

    // Логируем событие завершения сессии
    await prisma.securityEvent.create({
      data: {
        userId: payload.userId,
        type: 'LOGOUT',
        ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: JSON.stringify({ 
          action: 'terminate_session',
          terminatedSessionId: sessionId
        })
      }
    })

    return NextResponse.json({
      message: 'Сессия завершена успешно'
    })

  } catch (error) {
    console.error('Session termination error:', error)
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

