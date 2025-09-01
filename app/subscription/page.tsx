'use client'

import { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Check, Star, Shield, Zap, Users, Building, ArrowRight } from 'lucide-react'
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

  const plans = [
    {
      name: 'Пробный период',
      price: '0 ₽',
      period: '14 дней',
      description: 'Попробуйте все возможности сервиса без ограничений',
      features: [
        'До 5 классов',
        'Базовые настройки',
        'Экспорт в PDF',
        'Поддержка по email'
      ],
      cta: 'Начать работу',
      popular: false
    },
    {
      name: 'Pro: Годовой',
      price: '2990 ₽',
      period: 'в год',
      description: 'Полный доступ для одной школы на год',
      features: [
        'Неограниченное количество классов',
        'Все настройки и правила',
        'Приоритетная поддержка',
        'API доступ',
        'Резервное копирование',
        'Аналитика и отчёты'
      ],
      cta: 'Оформить подписку',
      popular: true,
      savings: 'Экономия 40%'
    },
    {
      name: 'Организация/Муниципалитет',
      price: 'По запросу',
      period: 'индивидуально',
      description: 'Корпоративные решения для нескольких школ',
      features: [
        'Множественные школы',
        'Централизованное управление',
        'Индивидуальная настройка',
        'Обучение персонала',
        'Техническая поддержка 24/7',
        'SLA гарантии'
      ],
      cta: 'Связаться с нами',
      popular: false
    }
  ]

  const comparisonTable = [
    {
      feature: 'Количество классов',
      trial: 'До 5',
      pro: 'Неограниченно',
      org: 'Неограниченно'
    },
    {
      feature: 'Настройка правил',
      trial: 'Базовые',
      pro: 'Полные',
      org: 'Индивидуальные'
    },
    {
      feature: 'Экспорт форматов',
      trial: 'PDF',
      pro: 'PDF, Excel, Word',
      org: 'Все форматы + API'
    },
    {
      feature: 'Поддержка',
      trial: 'Email',
      pro: 'Email + Чат',
      org: '24/7 + Телефон'
    },
    {
      feature: 'Резервное копирование',
      trial: 'Нет',
      pro: 'Автоматическое',
      org: 'Автоматическое + Ручное'
    }
  ]

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Header onOpenAuth={(returnTo, checkoutIntent) => openAuthModal(returnTo, checkoutIntent)} />
        
        {/* Hero Section */}
        <section className="bg-white border-b">
          <div className="container-custom py-16">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Выберите подходящий план
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Начните с пробного периода или сразу переходите к полному функционалу
              </p>
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-2xl shadow-lg p-8 relative ${
                    plan.popular ? 'ring-2 ring-primary-500 scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                        Популярный
                      </span>
                    </div>
                  )}
                  
                  {plan.savings && (
                    <div className="absolute -top-4 right-4">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {plan.savings}
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-2">{plan.period}</span>
                    </div>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => openAuthModal(window.location.pathname, true)}
                    className="w-full btn-primary py-3"
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Сравнение планов
              </h2>
              <p className="text-xl text-gray-600">
                Выберите план, который лучше всего подходит вашим потребностям
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Функция</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Пробный</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Pro</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Организация</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonTable.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4 px-6 font-medium text-gray-900">{row.feature}</td>
                      <td className="py-4 px-6 text-center text-gray-700">{row.trial}</td>
                      <td className="py-4 px-6 text-center text-gray-700">{row.pro}</td>
                      <td className="py-4 px-6 text-center text-gray-700">{row.org}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Trust & Security */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-12 text-center">
              <div className="max-w-3xl mx-auto">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Безопасность и надёжность
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Ваши данные защищены современными стандартами шифрования. Мы работаем с образовательными учреждениями по всей России и знаем, как важно обеспечить безопасность информации.
                </p>
                <div className="grid md:grid-cols-3 gap-6 text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span>SSL шифрование</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span>99.9% доступность</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>150+ школ доверяют</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ for Guests */}
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Часто задаваемые вопросы
              </h2>
              <p className="text-xl text-gray-600">
                Ответы на популярные вопросы о наших планах подписки
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Можно ли отменить подписку в любое время?
                </h3>
                <p className="text-gray-600">
                  Да, вы можете отменить подписку в любое время. При отмене вы сохраните доступ до конца оплаченного периода.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Что происходит после окончания пробного периода?
                </h3>
                <p className="text-gray-600">
                  После окончания пробного периода вам нужно будет выбрать платный план для продолжения работы с сервисом.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Есть ли скидки для образовательных учреждений?
                </h3>
                <p className="text-gray-600">
                  Да, мы предоставляем специальные условия и скидки для школ, колледжей и других образовательных учреждений.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-12 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">
                Готовы начать?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Присоединяйтесь к более чем 150 школам, которые уже используют наш сервис
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => openAuthModal(window.location.pathname, true)}
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
                >
                  Начать работу
                </button>
                <button
                  onClick={() => openAuthModal(window.location.pathname, false)}
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors duration-200"
                >
                  Связаться с нами
                </button>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>

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
