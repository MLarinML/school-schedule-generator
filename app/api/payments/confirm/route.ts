import { NextRequest, NextResponse } from 'next/server'
import { JWTManager } from '../../../../lib/auth/jwt'

export async function POST(request: NextRequest) {
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

    const { paymentIntentId, planId } = await request.json()
    
    if (!paymentIntentId || !planId) {
      return NextResponse.json({ error: 'Неверные параметры платежа' }, { status: 400 })
    }

    // Здесь должна быть проверка статуса платежа в платежной системе
    // Для демонстрации считаем платеж успешным
    
    const subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: payload.userId,
      planId,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + getPlanDuration(planId)).toISOString(),
      paymentIntentId
    }

    // В реальном приложении здесь будет:
    // 1. Проверка статуса платежа в Stripe/ЮKassa
    // 2. Создание подписки в базе данных
    // 3. Отправка подтверждающего email
    // 4. Активация функций подписки

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Подписка успешно активирована!'
    })

  } catch (error) {
    console.error('Ошибка подтверждения платежа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

function getPlanDuration(planId: string): number {
  const durations = {
    quarterly: 4 * 30 * 24 * 60 * 60 * 1000, // 4 месяца
    semiannual: 6 * 30 * 24 * 60 * 60 * 1000, // 6 месяцев  
    annual: 12 * 30 * 24 * 60 * 60 * 1000 // 12 месяцев
  }
  
  return durations[planId as keyof typeof durations] || durations.quarterly
}
