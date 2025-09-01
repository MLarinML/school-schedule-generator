'use client'

import { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  BookOpen, 
  Zap, 
  ArrowRight, 
  Sparkles, 
  Target, 
  TrendingUp,
  Shield,
  Lightbulb,
  Star,
  Rocket
} from 'lucide-react'

interface ProblemSolutionProps {
  onOpenAuth: (returnTo?: string, checkoutIntent?: boolean) => void
}

const ProblemSolution = ({ onOpenAuth }: ProblemSolutionProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'problems' | 'solutions'>('problems')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const problems = [
    {
      icon: AlertTriangle,
      title: 'Конфликты по кабинетам и учителям',
      description: 'Учитель не может быть в двух местах одновременно, кабинет уже занят другим классом',
      severity: 'Критично',
      impact: 'Блокирует работу',
      gradient: 'from-red-500 to-red-600',
      color: 'red'
    },
    {
      icon: Clock,
      title: 'Методические дни',
      description: 'Нужно учитывать дни, когда учителя не могут вести уроки',
      severity: 'Важно',
      impact: 'Нарушает планы',
      gradient: 'from-orange-500 to-orange-600',
      color: 'orange'
    },
    {
      icon: Users,
      title: 'Лимиты уроков подряд',
      description: 'Класс не может иметь больше 6 уроков подряд без перерыва',
      severity: 'Средне',
      impact: 'Влияет на качество',
      gradient: 'from-yellow-500 to-yellow-600',
      color: 'yellow'
    },
    {
      icon: BookOpen,
      title: 'Окна у классов',
      description: 'Пустые слоты в расписании создают неудобства для учеников',
      severity: 'Низко',
      impact: 'Снижает эффективность',
      gradient: 'from-blue-500 to-blue-600',
      color: 'blue'
    }
  ]

  const solutions = [
    {
      icon: Zap,
      title: 'Автоматическая генерация',
      description: 'Алгоритм учитывает все ограничения и создает корректное УмноеРасписание за минуты',
      benefit: 'Экономия времени',
      value: '90%',
      gradient: 'from-green-500 to-green-600',
      color: 'green'
    },
    {
      icon: CheckCircle,
      title: 'Учёт hard/soft правил',
      description: 'Жесткие правила (конфликты) и мягкие (предпочтения) с настраиваемыми весами',
      benefit: 'Гибкость',
      value: '100%',
      gradient: 'from-emerald-500 to-emerald-600',
      color: 'emerald'
    },
    {
      icon: BookOpen,
      title: 'Объяснимость причин',
      description: 'Понятные объяснения, почему урок не может быть поставлен в определенный слот',
      benefit: 'Прозрачность',
      value: '24/7',
      gradient: 'from-blue-500 to-blue-600',
      color: 'blue'
    },
    {
      icon: Users,
      title: 'Ручное редактирование',
      description: 'Возможность корректировки без нарушения логики и создания новых конфликтов',
      benefit: 'Контроль',
      value: 'Полный',
      gradient: 'from-purple-500 to-purple-600',
      color: 'purple'
    }
  ]

  const stats = [
    { label: 'Время экономии', value: '90%', icon: Clock, color: 'text-blue-600' },
    { label: 'Точность', value: '99.9%', icon: Target, color: 'text-green-600' },
    { label: 'Школ используют', value: '150+', icon: Users, color: 'text-purple-600' },
    { label: 'Удовлетворенность', value: '98%', icon: Star, color: 'text-yellow-600' }
  ]

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 via-white to-gray-100" aria-labelledby="problem-solution-heading">
      <div className="container-custom">
        {/* Заголовок с анимацией */}
        <div className={`text-center mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-green-500 rounded-2xl mb-6 shadow-xl">
            <Sparkles className="w-10 h-10 text-white" aria-hidden="true" />
          </div>
          <h2 
            id="problem-solution-heading"
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
          >
            От хаоса к порядку за минуты
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Мы понимаем, с какими трудностями сталкиваются завучи при составлении расписаний, 
            и предлагаем интеллектуальное решение
          </p>
          
          {/* Статистика */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={`text-center transition-all duration-500 delay-${index * 100} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className={`w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} aria-hidden="true" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Переключатель вкладок */}
        <div className={`flex justify-center mb-12 transition-all duration-500 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
            <button
              onClick={() => setActiveTab('problems')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'problems'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Проблемы
            </button>
            <button
              onClick={() => setActiveTab('solutions')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'solutions'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Решения
            </button>
          </div>
        </div>

        {/* Контент вкладок */}
        <div className={`transition-all duration-500 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {activeTab === 'problems' ? (
            /* Проблемы */
            <div className="space-y-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl mb-4">
                  <AlertTriangle className="w-8 h-8 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  С какими трудностями сталкиваются завучи
                </h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Каждый день завучи тратят часы на решение этих проблем вручную
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {problems.map((problem, index) => (
                  <div 
                    key={index}
                    className={`group relative transition-all duration-500 hover:scale-105 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full relative overflow-hidden">
                      {/* Градиентный фон при hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${problem.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                      
                      {/* Иконка с градиентом */}
                      <div className={`w-16 h-16 bg-gradient-to-r ${problem.gradient} rounded-2xl mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <problem.icon className="w-8 h-8 text-white" aria-hidden="true" />
                      </div>
                      
                      {/* Бейдж серьезности */}
                      <div className="absolute top-6 right-6">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${problem.gradient} text-white`}>
                          {problem.severity}
                        </div>
                      </div>
                      
                      {/* Заголовок */}
                      <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors duration-300">
                        {problem.title}
                      </h4>
                      
                      {/* Описание */}
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {problem.description}
                      </p>
                      
                      {/* Влияние */}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className={`w-2 h-2 bg-gradient-to-r ${problem.gradient} rounded-full`}></div>
                        <span>Влияние: {problem.impact}</span>
                      </div>
                      
                      {/* Hover эффект */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${problem.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
                    </div>
                    
                    {/* Плавающий элемент */}
                    {hoveredIndex === index && (
                      <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-200 animate-pulse">
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600">⚠️</div>
                          <div className="text-xs text-gray-500">Проблема</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Решения */
            <div className="space-y-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mb-4">
                  <Lightbulb className="w-8 h-8 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Как мы помогаем
                </h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Инновационные технологии для решения всех проблем планирования
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {solutions.map((solution, index) => (
                  <div 
                    key={index}
                    className={`group relative transition-all duration-500 hover:scale-105 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full relative overflow-hidden">
                      {/* Градиентный фон при hover */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${solution.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                      
                      {/* Иконка с градиентом */}
                      <div className={`w-16 h-16 bg-gradient-to-r ${solution.gradient} rounded-2xl mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <solution.icon className="w-8 h-8 text-white" aria-hidden="true" />
                      </div>
                      
                      {/* Бейдж пользы */}
                      <div className="absolute top-6 right-6">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${solution.gradient} text-white`}>
                          {solution.benefit}
                        </div>
                      </div>
                      
                      {/* Заголовок */}
                      <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors duration-300">
                        {solution.title}
                      </h4>
                      
                      {/* Описание */}
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {solution.description}
                      </p>
                      
                      {/* Значение */}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className={`w-2 h-2 bg-gradient-to-r ${solution.gradient} rounded-full`}></div>
                        <span>Результат: {solution.value}</span>
                      </div>
                      
                      {/* Hover эффект */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${solution.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
                    </div>
                    
                    {/* Плавающий элемент */}
                    {hoveredIndex === index && (
                      <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-200 animate-pulse">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">✨</div>
                          <div className="text-xs text-gray-500">Решение</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


      </div>
    </section>
  )
}

export default ProblemSolution
