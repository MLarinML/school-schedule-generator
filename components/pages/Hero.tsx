import { Play, CheckCircle } from 'lucide-react'

interface HeroProps {
  onOpenAuth: (returnTo?: string, checkoutIntent?: boolean) => void
}

const Hero = ({ onOpenAuth }: HeroProps) => {
  return (
    <section id="hero" className="section-padding bg-gradient-to-br from-primary-50 to-blue-50" aria-labelledby="hero-heading">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Текстовый контент */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 
                id="hero-heading"
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
              >
                Автогенерация школьного расписания{' '}
                <span className="text-primary-600">за минуты</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
                Создавайте корректные расписания с учётом блокеров учителей и школьных норм — 
                с объяснением конфликтов и экспортом для учителей и родителей
              </p>
            </div>

            {/* CTA кнопки */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => onOpenAuth(window.location.pathname, true)}
                className="btn-primary text-lg px-8 py-4"
              >
                Начать работу
              </button>
              <button className="btn-secondary text-lg px-8 py-4 flex items-center justify-center gap-2">
                <Play className="w-5 h-5" aria-hidden="true" />
                Узнать больше
              </button>
            </div>

            {/* Социальные доказательства */}
            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Доверяют более 150 школ по всей России</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
                  <span className="text-sm text-gray-700">"УмноеРасписание готово за 3 минуты"</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
                  <span className="text-sm text-gray-700">"90% меньше ручных правок"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Визуал - макет расписания */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="space-y-4">
                {/* Заголовок расписания */}
                <div className="text-center pb-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">УмноеРасписание 5А класса</h3>
                  <p className="text-sm text-gray-500">Понедельник - Пятница</p>
                </div>
                
                {/* Сетка расписания */}
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {/* Время */}
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-100 rounded flex items-center justify-center font-medium text-gray-700">1</div>
                    <div className="h-8 bg-gray-100 rounded flex items-center justify-center font-medium text-gray-700">2</div>
                    <div className="h-8 bg-gray-100 rounded flex items-center justify-center font-medium text-gray-700">3</div>
                    <div className="h-8 bg-gray-100 rounded flex items-center justify-center font-medium text-gray-700">4</div>
                    <div className="h-8 bg-gray-100 rounded flex items-center justify-center font-medium text-gray-700">5</div>
                    <div className="h-8 bg-gray-100 rounded flex items-center justify-center font-medium text-gray-700">6</div>
                  </div>
                  
                  {/* Понедельник */}
                  <div className="space-y-2">
                    <div className="h-8 bg-blue-100 rounded flex items-center justify-center text-blue-800 font-medium">Мат</div>
                    <div className="h-8 bg-green-100 rounded flex items-center justify-center text-green-800 font-medium">Рус</div>
                    <div className="h-8 bg-yellow-100 rounded flex items-center justify-center text-yellow-800 font-medium">Ист</div>
                    <div className="h-8 bg-purple-100 rounded flex items-center justify-center text-purple-800 font-medium">Физ</div>
                    <div className="h-8 bg-red-100 rounded flex items-center justify-center text-red-800 font-medium">Лит</div>
                    <div className="h-8 bg-indigo-100 rounded flex items-center justify-center text-indigo-800 font-medium">Англ</div>
                  </div>
                  
                  {/* Вторник */}
                  <div className="space-y-2">
                    <div className="h-8 bg-green-100 rounded flex items-center justify-center text-green-800 font-medium">Рус</div>
                    <div className="h-8 bg-blue-100 rounded flex items-center justify-center text-blue-800 font-medium">Мат</div>
                    <div className="h-8 bg-orange-100 rounded flex items-center justify-center text-orange-800 font-medium">Био</div>
                    <div className="h-8 bg-pink-100 rounded flex items-center justify-center text-pink-800 font-medium">Хим</div>
                    <div className="h-8 bg-teal-100 rounded flex items-center justify-center text-teal-800 font-medium">Гео</div>
                    <div className="h-8 bg-gray-100 rounded flex items-center justify-center text-gray-700 font-medium">Физ</div>
                  </div>
                  
                  {/* Среда */}
                  <div className="space-y-2">
                    <div className="h-8 bg-blue-100 rounded flex items-center justify-center text-blue-800 font-medium">Мат</div>
                    <div className="h-8 bg-green-100 rounded flex items-center justify-center text-green-800 font-medium">Рус</div>
                    <div className="h-8 bg-yellow-100 rounded flex items-center justify-center text-yellow-800 font-medium">Ист</div>
                    <div className="h-8 bg-purple-100 rounded flex items-center justify-center text-purple-800 font-medium">Физ</div>
                    <div className="h-8 bg-red-100 rounded flex items-center justify-center text-red-800 font-medium">Лит</div>
                    <div className="h-8 bg-indigo-100 rounded flex items-center justify-center text-indigo-800 font-medium">Англ</div>
                  </div>
                  
                  {/* Четверг */}
                  <div className="space-y-2">
                    <div className="h-8 bg-green-100 rounded flex items-center justify-center text-green-800 font-medium">Рус</div>
                    <div className="h-8 bg-blue-100 rounded flex items-center justify-center text-blue-800 font-medium">Мат</div>
                    <div className="h-8 bg-orange-100 rounded flex items-center justify-center text-orange-800 font-medium">Био</div>
                    <div className="h-8 bg-pink-100 rounded flex items-center justify-center text-pink-800 font-medium">Хим</div>
                    <div className="h-8 bg-teal-100 rounded flex items-center justify-center text-teal-800 font-medium">Гео</div>
                    <div className="h-8 bg-gray-100 rounded flex items-center justify-center text-gray-700 font-medium">Физ</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Плавающий элемент с метрикой */}
            <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">3 мин</div>
                <div className="text-xs text-gray-500">на генерацию</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
