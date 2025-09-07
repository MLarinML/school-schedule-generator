import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/session/route'

// Типы подписок
const SUBSCRIPTION_PLANS = {
  quarterly: {
    name: 'Квартальная подписка',
    price: 3999,
    period: '4 месяца',
    features: ['До 10 классов', 'До 30 учителей', 'Базовые настройки']
  },
  semiannual: {
    name: 'Полугодовая подписка', 
    price: 5499,
    period: '6 месяцев',
    features: ['До 25 классов', 'До 75 учителей', 'Расширенные настройки']
  },
  annual: {
    name: 'Годовая подписка',
    price: 9999,
    period: '12 месяцев', 
    features: ['Неограниченные классы и учителя', 'Все настройки', 'Приоритетная поддержка']
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const { planId } = await request.json()
    
    if (!planId || !SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
      return NextResponse.json({ error: 'Неверный план подписки' }, { status: 400 })
    }

    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]
    
    // Здесь должна быть интеграция с платежной системой
    // Для демонстрации создаем mock платеж
    
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: plan.price,
      currency: 'rub',
      planId,
      planName: plan.name,
      userId: session.user.id,
      status: 'requires_payment_method',
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
    }

    // В реальном приложении здесь будет:
    // 1. Создание платежа в Stripe/ЮKassa
    // 2. Сохранение в базу данных
    // 3. Отправка уведомлений

    return NextResponse.json({
      success: true,
      paymentIntent
    })

  } catch (error) {
    console.error('Ошибка создания платежа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
