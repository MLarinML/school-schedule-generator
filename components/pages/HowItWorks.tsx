'use client'

import React, { useState, useEffect } from 'react'
import { ArrowRight, CheckCircle, Upload, Settings, CheckSquare, FileText, Users, Clock, Zap, Eye, Edit, Download, Share2 } from 'lucide-react'

interface HowItWorksProps {
  onOpenAuth: (returnTo?: string, checkoutIntent?: boolean) => void
}

const HowItWorks = ({ onOpenAuth }: HowItWorksProps) => {
  const [activeStep, setActiveStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const steps = [
    {
      number: '01',
      title: 'Импорт данных',
      description: 'Импортируйте классы, предметы, учителей и кабинеты или внесите вручную через удобный интерфейс',
      leftDetails: [
        { icon: Upload, text: 'Excel/CSV импорт', color: 'bg-blue-100 text-blue-600' },
        { icon: Edit, text: 'Ручной ввод данных', color: 'bg-green-100 text-green-600' },
        { icon: FileText, text: 'Шаблоны для быстрого старта', color: 'bg-purple-100 text-purple-600' },
        { icon: CheckCircle, text: 'Валидация данных', color: 'bg-orange-100 text-orange-600' }
      ],
      rightDetails: [
        { icon: Upload, text: 'Загрузите готовые файлы Excel или CSV с данными вашей школы', color: 'bg-blue-100 text-blue-600' },
        { icon: Edit, text: 'Создайте новые записи через интуитивный интерфейс', color: 'bg-green-100 text-green-600' },
        { icon: FileText, text: 'Используйте готовые шаблоны для ускорения процесса', color: 'bg-purple-100 text-purple-600' },
        { icon: CheckCircle, text: 'Автоматическая проверка корректности введенных данных', color: 'bg-orange-100 text-orange-600' }
      ],
      icon: Upload,
      gradient: 'from-blue-500 to-blue-600',
      accent: 'blue'
    },
    {
      number: '02',
      title: 'Настройка правил',
      description: 'Задайте блокеры учителей, школьные нормы и запустите автоматическую генерацию',
      leftDetails: [
        { icon: Users, text: 'Методические дни', color: 'bg-indigo-100 text-indigo-600' },
        { icon: Clock, text: 'Лимиты нагрузки', color: 'bg-pink-100 text-pink-600' },
        { icon: CheckSquare, text: 'Предпочтения по времени', color: 'bg-teal-100 text-teal-600' },
        { icon: Settings, text: 'Ограничения по кабинетам', color: 'bg-amber-100 text-amber-600' }
      ],
      rightDetails: [
        { icon: Users, text: 'Укажите дни, когда учителя не могут вести уроки', color: 'bg-indigo-100 text-indigo-600' },
        { icon: Clock, text: 'Установите максимальное количество уроков в день', color: 'bg-pink-100 text-pink-600' },
        { icon: CheckSquare, text: 'Настройте предпочтительное время для предметов', color: 'bg-teal-100 text-teal-600' },
        { icon: Settings, text: 'Ограничьте использование определенных кабинетов', color: 'bg-amber-100 text-amber-600' }
      ],
      icon: Settings,
      gradient: 'from-purple-500 to-purple-600',
      accent: 'purple'
    },
    {
      number: '03',
      title: 'Результат и правки',
      description: 'Просмотрите объяснения конфликтов, внесите правки и опубликуйте готовое УмноеРасписание',
      leftDetails: [
        { icon: Eye, text: 'Анализ конфликтов', color: 'bg-red-100 text-red-600' },
        { icon: Edit, text: 'Визуальный редактор', color: 'bg-emerald-100 text-emerald-600' },
        { icon: Download, text: 'Экспорт в PDF/Excel', color: 'bg-cyan-100 text-cyan-600' },
        { icon: Share2, text: 'Публикация для учителей', color: 'bg-violet-100 text-violet-600' }
      ],
      rightDetails: [
        { icon: Eye, text: 'Детальный разбор всех конфликтов с рекомендациями', color: 'bg-red-100 text-red-600' },
        { icon: Edit, text: 'Удобное редактирование с drag-and-drop', color: 'bg-emerald-100 text-emerald-600' },
        { icon: Download, text: 'Экспорт в популярные форматы для печати', color: 'bg-cyan-100 text-cyan-600' },
        { icon: Share2, text: 'Отправка расписания учителям по email', color: 'bg-violet-100 text-violet-600' }
      ],
      icon: CheckSquare,
      gradient: 'from-emerald-500 to-emerald-600',
      accent: 'emerald'
    }
  ]

  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex)
  }

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 via-white to-gray-50" aria-labelledby="how-it-works-heading">
      <div className="container-custom">
        {/* Заголовок с анимацией */}
        <div className={`text-center mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 
            id="how-it-works-heading"
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Как это работает
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Всего три простых шага от хаоса к идеальному расписанию
          </p>
        </div>

        {/* Интерактивная навигация по шагам */}
        <div className="flex justify-center mb-16">
          <div className="flex space-x-4 p-2 bg-white rounded-2xl shadow-lg border border-gray-200">
            {steps.map((step, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-primary-500 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg font-bold">{step.number}</span>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Основной контент шага с боковыми кнопками */}
        <div className="relative max-w-7xl mx-auto">
          {/* Левая кнопка навигации */}
          <button
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            className={`absolute -left-8 top-1/2 transform -translate-y-1/2 z-10 p-8 rounded-full transition-all duration-300 shadow-2xl ${
              activeStep === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                : 'bg-white text-primary-600 hover:bg-primary-50 hover:scale-110 border-2 border-primary-200'
            }`}
            aria-label="Предыдущий шаг"
          >
            <ArrowRight className="w-10 h-10 rotate-180" />
          </button>

          {/* Правая кнопка навигации */}
          <button
            onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
            disabled={activeStep === steps.length - 1}
            className={`absolute -right-8 top-1/2 transform -translate-y-1/2 z-10 p-8 rounded-full transition-all duration-300 shadow-2xl ${
              activeStep === steps.length - 1
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                : 'bg-white text-primary-600 hover:bg-primary-50 hover:scale-110 border-2 border-primary-200'
            }`}
            aria-label="Следующий шаг"
          >
            <ArrowRight className="w-10 h-10" />
          </button>

          <div className="grid lg:grid-cols-2 gap-16 items-center px-32">
            {/* Левая часть - описание шага */}
            <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <div className="space-y-8">
                {/* Номер и заголовок */}
                <div className="flex items-center space-x-6">
                  <div className={`w-20 h-20 bg-gradient-to-r ${steps[activeStep].gradient} rounded-2xl flex items-center justify-center shadow-xl`}>
                    <span className="text-3xl font-bold text-white">{steps[activeStep].number}</span>
                  </div>
                  <div>
                    <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                      {steps[activeStep].title}
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {steps[activeStep].description}
                    </p>
                  </div>
                </div>

                {/* Детали шага */}
                <div className="space-y-4">
                  {steps[activeStep].leftDetails.map((detail, detailIndex) => (
                    <div 
                      key={detailIndex}
                      className={`flex items-center space-x-4 p-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-md ${
                        activeStep === 0 ? 'border-blue-200 bg-blue-50' :
                        activeStep === 1 ? 'border-purple-200 bg-purple-50' :
                        'border-emerald-200 bg-emerald-50'
                      }`}
                    >
                      <div className={`w-12 h-12 ${detail.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <detail.icon className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <span className="font-medium text-gray-800">{detail.text}</span>
                    </div>
                  ))}
                </div>

                {/* Прогресс бар */}
                <div className="pt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Шаг {activeStep + 1} из {steps.length}</span>
                    <span>{Math.round(((activeStep + 1) / steps.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 bg-gradient-to-r ${steps[activeStep].gradient} rounded-full transition-all duration-500`}
                      style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Правая часть - интерактивная визуализация */}
            <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              <div className="relative">
                {/* Основная карточка */}
                <div className={`bg-gradient-to-br ${steps[activeStep].gradient} rounded-3xl p-8 text-white shadow-2xl transform transition-all duration-500 hover:scale-105`}>
                  <div className="text-center mb-8">
                    <div className="w-24 h-24 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                      {React.createElement(steps[activeStep].icon, { className: "w-12 h-12", "aria-hidden": true })}
                    </div>
                    <h4 className="text-2xl font-bold mb-2">
                      Шаг {activeStep + 1}
                    </h4>
                    <p className="text-white text-opacity-90">
                      {steps[activeStep].title}
                    </p>
                  </div>
                  
                  {/* Анимированные элементы */}
                  <div className="space-y-4">
                    {steps[activeStep].rightDetails.map((detail, detailIndex) => (
                      <div 
                        key={detailIndex}
                        className="flex items-center space-x-3 bg-white bg-opacity-10 rounded-xl p-3 backdrop-blur-sm"
                        style={{
                          animationDelay: `${detailIndex * 200}ms`,
                          animation: 'slideInRight 0.5s ease-out forwards'
                        }}
                      >
                        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-medium">{detail.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Плавающие элементы */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600 mb-1">
                      {activeStep + 1}
                    </div>
                    <div className="text-xs text-gray-500">текущий шаг</div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-yellow-400 rounded-2xl p-4 shadow-xl">
                  <div className="text-center">
                    <Zap className="w-6 h-6 text-white mx-auto mb-1" />
                    <div className="text-xs text-white font-medium">Быстро</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  )
}

export default HowItWorks
