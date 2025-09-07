'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Check, Star, Shield, Zap, Users, Building, ArrowRight, Calendar, Clock, Award, Rocket } from 'lucide-react'
import { Header, Footer } from '../../components/layout'
import { AuthModal } from '../../components/auth'
import { PaymentModal } from '../../components/payments'

const SubscriptionPage = () => {
  const { isAuthModalOpen, closeAuthModal, returnTo, checkoutIntent, openAuthModal, user } = useAuth()
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean
    planId: string
    planName: string
    price: string
    period: string
  }>({
    isOpen: false,
    planId: '',
    planName: '',
    price: '',
    period: ''
  })

  // Автоматически открываем модальное окно входа, если в URL есть параметр auth=login
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('auth') === 'login') {
      openAuthModal()
    }
  }, [openAuthModal])

  const handleSubscribe = (subscription: any) => {
    if (!user) {
      // Если пользователь не авторизован, открываем модальное окно входа
      openAuthModal('/subscription', true)
      return
    }

    // Если пользователь авторизован, открываем модальное окно оплаты
    setPaymentModal({
      isOpen: true,
      planId: subscription.id,
      planName: subscription.name,
      price: subscription.price,
      period: subscription.period
    })
  }

  const handlePaymentSuccess = (subscription: any) => {
    setPaymentModal(prev => ({ ...prev, isOpen: false }))
    // Здесь можно добавить редирект или уведомление об успешной оплате
    console.log('Подписка активирована:', subscription)
  }

  const handleClosePaymentModal = () => {
    setPaymentModal(prev => ({ ...prev, isOpen: false }))
  }

  const subscriptions = [
    {
      id: 'quarterly',
      name: 'Квартальная подписка',
      price: '3999 ₽',
      period: '4 месяца',
      originalPrice: '3996 ₽',
      savings: 'Базовый тариф',
      description: 'Идеально для тестирования и небольших школ',
      popular: false,
      features: [
        'До 10 классов',
        'До 30 учителей',
        'Базовые настройки планирования',
        'Экспорт в PDF и Excel',
        'Email поддержка',
        'Автоматическая генерация',
        'Проверка конфликтов',
        'Визуальный редактор'
      ]
    },
    {
      id: 'semiannual',
      name: 'Полугодовая подписка',
      price: '5499 ₽',
      period: '6 месяцев',
      originalPrice: '5994 ₽',
      savings: 'Экономия 8%',
      description: 'Оптимальный выбор для большинства школ',
      popular: true,
      features: [
        'До 25 классов',
        'До 75 учителей',
        'Расширенные настройки',
        'Приоритетная поддержка',
        'API доступ',
        'Резервное копирование',
        'Аналитика и отчёты',
        'Обновления включены'
      ]
    },
    {
      id: 'annual',
      name: 'Годовая подписка',
      price: '9999 ₽',
      period: '12 месяцев',
      originalPrice: '11988 ₽',
      savings: 'Экономия 17%',
      description: 'Максимальная выгода для крупных школ',
      popular: false,
      features: [
        'Неограниченные классы и учителя',
        'Все настройки и правила',
        'Приоритетная поддержка 24/7',
        'Персональный менеджер',
        'API интеграции',
        'Автоматическое резервное копирование',
        'Расширенная аналитика',
        'Обучение персонала включено'
      ]
    }
  ]

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Header onOpenAuth={(returnTo, checkoutIntent) => openAuthModal(returnTo, checkoutIntent)} />
        
        {/* Hero секция */}
        <section className="pt-16 pb-12">
          <div className="container-custom text-center">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-6 shadow-xl">
                <Star className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Выберите подходящий тариф
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Гибкие варианты подписки для школ любого размера. Чем дольше срок — тем больше экономия!
              </p>
            </div>
          </div>
        </section>

        {/* Тарифы */}
        <section className="py-12">
          <div className="container-custom">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-3 gap-8">
                {subscriptions.map((subscription, index) => (
                  <div key={subscription.id} className="relative">
                    {/* Популярный бейдж */}
                    {subscription.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-lg">
                          ⭐ Рекомендуемый
                        </div>
                      </div>
                    )}
                    
                    {/* Карточка тарифа */}
                    <div className={`relative bg-white rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                      subscription.popular 
                        ? 'border-primary-300 scale-105' 
                        : 'border-gray-100 hover:border-primary-200'
                    }`}>
                      {/* Заголовок и цена */}
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          {subscription.name}
                        </h3>
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <div className="text-4xl font-bold text-primary-600">
                            {subscription.price}
                          </div>
                          <div className="text-sm text-gray-600">
                            {subscription.period}
                          </div>
                        </div>
                        
                        {/* Экономия */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <span className="text-sm text-gray-500 line-through">
                            {subscription.originalPrice}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            subscription.popular 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {subscription.savings}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {subscription.description}
                        </p>
                      </div>

                      {/* Кнопка подписки */}
                      <div className="text-center mb-6">
                        <button 
                          onClick={() => handleSubscribe(subscription)}
                          className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-300 ${
                            subscription.popular
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {subscription.popular ? 'Выбрать тариф' : 'Оформить подписку'}
                          <ArrowRight className="inline-block ml-2 w-4 h-4" />
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          Без скрытых платежей
                        </p>
                      </div>

                      {/* Возможности */}
                      <div className="space-y-3">
                        {subscription.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                              <Check className="w-2.5 h-2.5 text-green-600" aria-hidden="true" />
                            </div>
                            <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ секция */}
        <section className="py-12 bg-white">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  Часто задаваемые вопросы
                </h2>
                <p className="text-base text-gray-600">
                  Ответы на популярные вопросы о тарифах
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Какой тариф выбрать для моей школы?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Квартальный — для небольших школ до 10 классов. Полугодовой — оптимальный для большинства школ до 25 классов. Годовой — для крупных школ с неограниченными потребностями.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Можно ли изменить тариф в процессе использования?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Да, вы можете в любой момент перейти на более высокий тариф. При переходе на более низкий тариф изменения вступят в силу после окончания текущего периода.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Включена ли техническая поддержка во всех тарифах?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Да, все тарифы включают поддержку. В квартальном — email поддержка, в полугодовом и годовом — приоритетная поддержка с персональным менеджером.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Что происходит с данными при окончании подписки?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ваши данные сохраняются в течение 30 дней после окончания подписки. Вы можете продлить подписку или экспортировать данные в удобном формате.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>



        <Footer />
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        returnTo={returnTo}
        checkoutIntent={checkoutIntent}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={handleClosePaymentModal}
        planId={paymentModal.planId}
        planName={paymentModal.planName}
        price={paymentModal.price}
        period={paymentModal.period}
        onSuccess={handlePaymentSuccess}
      />
    </>
  )
}

export default SubscriptionPage
