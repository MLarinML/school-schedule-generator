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
        <section className="pt-16 pb-12">
          <div className="container-custom text-center">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-6 shadow-xl">
                <Star className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Годовая подписка УмноеРасписание
              </h1>
            </div>
          </div>
        </section>

        {/* Основной тариф */}
        <section className="py-12">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                {/* Фон с градиентом */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl transform rotate-1 opacity-10"></div>
                
                {/* Основная карточка */}
                <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                  {/* Бейдж популярности */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-lg">
                      ⭐ Рекомендуемый выбор
                    </div>
                  </div>

                  {/* Заголовок и цена */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                      {subscription.name}
                    </h2>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="text-5xl md:text-6xl font-bold text-primary-600">
                        {subscription.price}
                      </div>
                      <div className="text-lg text-gray-600">
                        {subscription.period}
                      </div>
                    </div>
                    
                    {/* Экономия */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <span className="text-base text-gray-500 line-through">
                        {subscription.originalPrice}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {subscription.savings}
                      </span>
                    </div>
                    
                    <p className="text-base text-gray-600 max-w-xl mx-auto">
                      {subscription.description}
                    </p>
                  </div>

                  {/* Кнопка подписки */}
                  <div className="text-center mb-8">
                    <button 
                      onClick={() => openAuthModal('/subscription', true)}
                      className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-lg py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
                    >
                      Оформить подписку
                      <ArrowRight className="inline-block ml-2 w-5 h-5" />
                    </button>
                    <p className="text-xs text-gray-500 mt-3">
                      Без скрытых платежей • Можно отменить в любой момент
                    </p>
                  </div>

                  {/* Возможности */}
                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    {subscription.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-600" aria-hidden="true" />
                        </div>
                        <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Дополнительные преимущества */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                      Дополнительные преимущества
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {subscription.highlights.map((highlight, index) => (
                        <div key={index} className="text-center group">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <highlight.icon className="w-6 h-6 text-primary-600" aria-hidden="true" />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {highlight.title}
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed">
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
        <section className="py-12 bg-white">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  Часто задаваемые вопросы
                </h2>
                <p className="text-base text-gray-600">
                  Ответы на популярные вопросы о годовой подписке
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Можно ли отменить подписку?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Да, вы можете отменить подписку в любой момент. При отмене вы сохраните доступ до конца оплаченного периода.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Что происходит после окончания подписки?
                  </h3>
                  <p className="text-sm text-gray-600">
                    После окончания подписки вы можете продлить её или перейти на базовый тариф. Ваши данные сохраняются.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Включена ли техническая поддержка?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Да, годовая подписка включает приоритетную поддержку 24/7 и персонального менеджера.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA секция */}
        <section className="py-12">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-xl mb-4">
                  <Sparkles className="w-8 h-8" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  Готовы изменить подход к планированию?
                </h2>
                <p className="text-base text-primary-100 mb-6 max-w-xl mx-auto">
                  Присоединяйтесь к сотням школ, которые уже используют УмноеРасписание
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    onClick={() => openAuthModal('/subscription', true)}
                    className="bg-white text-primary-600 font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Начать подписку
                    <ArrowRight className="inline-block ml-2 w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openAuthModal('/subscription', false)}
                    className="bg-white bg-opacity-20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:bg-opacity-30 hover:scale-105"
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
