'use client'

import { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Check, Star, Shield, Zap, Users, Building, ArrowRight, Calendar, Clock, Award, Rocket, Sparkles } from 'lucide-react'
import { Header, Footer } from '../../components/layout'
import { AuthModal } from '../../components/auth'

const SubscriptionPage = () => {
  const { isAuthModalOpen, closeAuthModal, returnTo, checkoutIntent, openAuthModal } = useAuth()

  // Автоматически открываем модальное окно входа, если в URL есть параметр auth=login
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('auth') === 'login') {
      openAuthModal()
    }
  }, [openAuthModal])

  const subscription = {
    name: 'Годовая подписка',
    price: '9999 ₽',
    period: 'в год',
    originalPrice: '14990 ₽',
    savings: 'Экономия 33%',
    description: 'Полный доступ ко всем возможностям УмноеРасписание на целый год',
    features: [
      'Неограниченное количество классов и учителей',
      'Все настройки и правила планирования',
      'Приоритетная поддержка 24/7',
      'API доступ для интеграций',
      'Автоматическое резервное копирование',
      'Расширенная аналитика и отчёты',
      'Обновления и новые функции',
      'Обучение персонала включено'
    ],
    highlights: [
      {
        icon: Shield,
        title: 'Безопасность',
        description: 'Ваши данные защищены по стандартам ISO 27001'
      },
      {
        icon: Clock,
        title: 'Экономия времени',
        description: '90% времени экономии на составлении расписаний'
      },
      {
        icon: Users,
        title: 'Поддержка',
        description: 'Персональный менеджер и техническая поддержка'
      },
      {
        icon: Rocket,
        title: 'Развитие',
        description: 'Постоянные обновления и новые возможности'
      }
    ]
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Header onOpenAuth={(returnTo, checkoutIntent) => openAuthModal(returnTo, checkoutIntent)} />
        
        {/* Hero секция */}
        <section className="pt-20 pb-16">
          <div className="container-custom text-center">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-8 shadow-xl">
                <Star className="w-10 h-10 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Выберите идеальный план
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Получите доступ ко всем возможностям УмноеРасписание и измените подход к планированию в вашей школе
              </p>
            </div>
          </div>
        </section>

        {/* Основной тариф */}
        <section className="py-16">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Фон с градиентом */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl transform rotate-1 opacity-10"></div>
                
                {/* Основная карточка */}
                <div className="relative bg-white rounded-3xl p-12 shadow-2xl border border-gray-100">
                  {/* Бейдж популярности */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      ⭐ Рекомендуемый выбор
                    </div>
                  </div>

                  {/* Заголовок и цена */}
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                      {subscription.name}
                    </h2>
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="text-6xl md:text-7xl font-bold text-primary-600">
                        {subscription.price}
                      </div>
                      <div className="text-xl text-gray-600">
                        {subscription.period}
                      </div>
                    </div>
                    
                    {/* Экономия */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <span className="text-lg text-gray-500 line-through">
                        {subscription.originalPrice}
                      </span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {subscription.savings}
                      </span>
                    </div>
                    
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                      {subscription.description}
                    </p>
                  </div>

                  {/* Кнопка подписки */}
                  <div className="text-center mb-12">
                    <button 
                      onClick={() => openAuthModal('/subscription', true)}
                      className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-xl py-4 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 transform"
                    >
                      Оформить подписку
                      <ArrowRight className="inline-block ml-2 w-6 h-6" />
                    </button>
                    <p className="text-sm text-gray-500 mt-4">
                      Без скрытых платежей • Можно отменить в любой момент
                    </p>
                  </div>

                  {/* Возможности */}
                  <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {subscription.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" aria-hidden="true" />
                        </div>
                        <span className="text-gray-700 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Дополнительные преимущества */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                      Дополнительные преимущества
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {subscription.highlights.map((highlight, index) => (
                        <div key={index} className="text-center group">
                          <div className="w-16 h-16 bg-gradient-to-r from-primary-100 to-primary-200 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <highlight.icon className="w-8 h-8 text-primary-600" aria-hidden="true" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {highlight.title}
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {highlight.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ секция */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Часто задаваемые вопросы
                </h2>
                <p className="text-xl text-gray-600">
                  Ответы на популярные вопросы о подписке
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Можно ли отменить подписку?
                  </h3>
                  <p className="text-gray-600">
                    Да, вы можете отменить подписку в любой момент. При отмене вы сохраните доступ до конца оплаченного периода.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Что происходит после окончания подписки?
                  </h3>
                  <p className="text-gray-600">
                    После окончания подписки вы можете продлить её или перейти на базовый тариф. Ваши данные сохраняются.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Включена ли техническая поддержка?
                  </h3>
                  <p className="text-gray-600">
                    Да, годовая подписка включает приоритетную поддержку 24/7 и персонального менеджера.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA секция */}
        <section className="py-16">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-12 text-white shadow-2xl">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-2xl mb-6">
                  <Sparkles className="w-10 h-10" aria-hidden="true" />
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  Готовы изменить подход к планированию?
                </h2>
                <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                  Присоединяйтесь к сотням школ, которые уже используют УмноеРасписание
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => openAuthModal('/subscription', true)}
                    className="bg-white text-primary-600 font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Начать подписку
                    <ArrowRight className="inline-block ml-2 w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => openAuthModal('/subscription', false)}
                    className="bg-white bg-opacity-20 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:bg-opacity-30 hover:scale-105"
                  >
                    Узнать больше
                  </button>
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
    </>
  )
}

export default SubscriptionPage
