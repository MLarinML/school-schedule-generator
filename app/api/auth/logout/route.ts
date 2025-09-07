import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { JWTManager } from '../../../../lib/auth/jwt'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Получаем токен из cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'Уже вышли из системы' },
        { status: 200 }
      )
    }

    // Верифицируем токен
    const payload = JWTManager.verifyToken(token)
    
    if (!payload) {
      // Токен недействителен, просто очищаем cookie
      const response = NextResponse.json(
        { message: 'Уже вышли из системы' },
        { status: 200 }
      )
      
      response.cookies.delete('auth-token')
      return response
    }

    // Получаем IP адрес
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Помечаем сессию как отозванную
    await prisma.session.update({
      where: { id: payload.sessionId },
      data: { 
        isRevoked: true,
        lastSeenAt: new Date()
      }
    })

    // Логируем событие выхода
    await prisma.securityEvent.create({
      data: {
        userId: payload.userId,
        type: 'LOGOUT',
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: JSON.stringify({ sessionId: payload.sessionId })
      }
    })

    // Очищаем cookie
    const response = NextResponse.json(
      { message: 'Выход выполнен успешно' },
      { status: 200 }
    )
    
    response.cookies.delete('auth-token')
    return response

  } catch (error) {
    console.error('Logout error:', error)
    
    // В случае ошибки все равно очищаем cookie
    const response = NextResponse.json(
      { message: 'Выход выполнен' },
      { status: 200 }
    )
    
    response.cookies.delete('auth-token')
    return response
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Получаем токен из cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'Уже вышли из системы' },
        { status: 200 }
      )
    }

    // Верифицируем токен
    const payload = JWTManager.verifyToken(token)
    
    if (!payload) {
      // Токен недействителен, просто очищаем cookie
      const response = NextResponse.json(
        { message: 'Уже вышли из системы' },
        { status: 200 }
      )
      
      response.cookies.delete('auth-token')
      return response
    }

    // Получаем IP адрес
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Отзываем все сессии пользователя
    await prisma.session.updateMany({
      where: { 
        userId: payload.userId,
        isRevoked: false
      },
      data: { 
        isRevoked: true,
        lastSeenAt: new Date()
      }
    })

    // Логируем событие отзыва всех сессий
    await prisma.securityEvent.create({
      data: {
        userId: payload.userId,
        type: 'LOGOUT',
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: JSON.stringify({ action: 'logout_all_sessions' })
      }
    })

    // Очищаем cookie
    const response = NextResponse.json(
      { message: 'Все сессии завершены' },
      { status: 200 }
    )
    
    response.cookies.delete('auth-token')
    return response

  } catch (error) {
    console.error('Logout all error:', error)
    
    // В случае ошибки все равно очищаем cookie
    const response = NextResponse.json(
      { message: 'Сессии завершены' },
      { status: 200 }
    )
    
    response.cookies.delete('auth-token')
    return response
  }
}

