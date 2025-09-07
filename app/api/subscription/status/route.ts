import { NextRequest, NextResponse } from 'next/server'
import { JWTManager } from '../../../../lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    // Получаем токен из cookie
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    // Верифицируем токен
    const payload = JWTManager.verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: 'Сессия истекла или недействительна' }, { status: 401 })
    }

    // В реальном приложении здесь будет запрос к базе данных
    // Для демонстрации возвращаем mock данные
    
    const mockSubscription = {
      id: 'sub_123456789',
      userId: payload.userId,
      planId: 'semiannual',
      status: 'active',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 дней назад
      endDate: new Date(Date.now() + 5 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 5 месяцев вперед
      planName: 'Полугодовая подписка',
      features: [
        'До 25 классов',
        'До 75 учителей', 
        'Расширенные настройки',
        'Приоритетная поддержка'
      ]
    }

    return NextResponse.json({
      success: true,
      subscription: mockSubscription,
      isActive: mockSubscription.status === 'active',
      daysRemaining: Math.ceil((new Date(mockSubscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    })

  } catch (error) {
    console.error('Ошибка получения статуса подписки:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
