'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  BookOpen, 
  MessageSquare, 
  Edit3, 
  Download,
  Calendar,
  CheckCircle,
  Star
} from 'lucide-react'

const Features = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      icon: Shield,
      title: 'Блокеры и доступность',
      description: 'Учитываем методические дни, недоступные слоты и нагрузки учителей',
      details: ['Методические дни', 'Недоступные слоты', 'Нагрузки по часам'],
      gradient: 'from-blue-500 to-blue-600',
      accent: 'blue',
      stats: '100%',
      statLabel: 'точность'
    },
    {
      icon: BookOpen,
      title: 'Нормативы школы',
      description: 'Соблюдаем лимиты уроков в день, подряд, обед и окна',
      details: ['Лимиты уроков в день', 'Максимум подряд', 'Обеденные перерывы', 'Минимум окон'],
      gradient: 'from-emerald-500 to-emerald-600',
      accent: 'emerald',
      stats: '0',
      statLabel: 'нарушений'
    },
    {
      icon: MessageSquare,
      title: 'Объяснение конфликтов',
      description: 'Точные причины, почему УмноеРасписание не может быть составлено',
      details: ['Детальный анализ', 'Конкретные рекомендации', 'Пути решения'],
      gradient: 'from-purple-500 to-purple-600',
      accent: 'purple',
      stats: '24/7',
      statLabel: 'поддержка'
    },
    {
      icon: Edit3,
      title: 'Редактор сетки',
      description: 'Drag-and-drop редактирование с подсветкой нарушений',
      details: ['Визуальное редактирование', 'Подсветка ошибок', 'Автопроверка'],
      gradient: 'from-orange-500 to-orange-600',
      accent: 'orange',
      stats: '3x',
      statLabel: 'быстрее'
    },
    {
      icon: Download,
      title: 'Экспорт и публикация',
      description: 'PDF, Excel, публичные ссылки для учителей и родителей',
      details: ['PDF распечатка', 'Excel таблицы', 'Публичные ссылки', 'Интеграции'],
      gradient: 'from-pink-500 to-pink-600',
      accent: 'pink',
      stats: '10+',
      statLabel: 'форматов'
    },
    {
      icon: Calendar,
      title: 'Умное планирование',
      description: 'Автоматическое распределение с учётом всех ограничений',
      details: ['AI алгоритм', 'Оптимизация нагрузки', 'Баланс предметов'],
      gradient: 'from-indigo-500 to-indigo-600',
      accent: 'indigo',
      stats: 'AI',
      statLabel: 'алгоритм'
    }
  ]



  return (
    <section id="features" className="section-padding bg-gradient-to-br from-gray-50 via-white to-gray-100" aria-labelledby="features-heading">
      <div className="container-custom">
        {/* Заголовок с анимацией */}
        <div className={`text-center mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-6 shadow-xl">
            <Star className="w-10 h-10 text-white" aria-hidden="true" />
          </div>
          <h2 
            id="features-heading"
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Ключевые возможности
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Все необходимые инструменты для создания идеального школьного расписания
          </p>
          
          {/* Статистика */}
          <div className="flex justify-center mt-8 space-x-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{features.length}</div>
              <div className="text-sm text-gray-500">основных функций</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">150+</div>
              <div className="text-sm text-gray-500">активных школ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">99.9%</div>
              <div className="text-sm text-gray-500">точность</div>
            </div>
          </div>
        </div>

        {/* Основные возможности */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`group relative transition-all duration-500 hover:scale-105 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Основная карточка */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full relative overflow-hidden">
                {/* Градиентный фон при hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                
                {/* Иконка с градиентом */}
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" aria-hidden="true" />
                </div>
                
                {/* Статистика */}
                <div className="absolute top-6 right-6 text-right">
                  <div className={`text-2xl font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                    {feature.stats}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    {feature.statLabel}
                  </div>
                </div>
                
                {/* Заголовок */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-primary-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                {/* Описание */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Детали */}
                <ul className="space-y-2">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center gap-2 text-sm text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                      <div className={`w-2 h-2 bg-gradient-to-r ${feature.gradient} rounded-full flex-shrink-0`}></div>
                      {detail}
                    </li>
                  ))}
                </ul>
                
                {/* Hover эффект */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
              </div>
              
              {/* Плавающий элемент */}
              {hoveredIndex === index && (
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-200 animate-pulse">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary-600">✨</div>
                    <div className="text-xs text-gray-500">Активно</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>


      </div>
    </section>
  )
}

export default Features
