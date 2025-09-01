'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, HelpCircle, Lightbulb, Shield, Clock, Users, FileText, Settings, Zap, Edit } from 'lucide-react'

interface FAQProps {
  onOpenAuth: (returnTo?: string, checkoutIntent?: boolean) => void
}

const FAQ = ({ onOpenAuth }: FAQProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle(index)
    }
  }

  const faqs = [
    {
      question: 'Как задать методический день для учителя?',
      answer: 'В настройках учителя вы можете указать конкретные дни недели или даты, когда он не может вести уроки. Система автоматически учтёт эти ограничения при генерации расписания.',
      icon: Users,
      category: 'Настройки',
      color: 'from-blue-500 to-blue-600'
    },
    {
      question: 'Что делать, если генерация расписания не удалась?',
      answer: 'Система покажет детальный отчёт о причинах неудачи. Обычно это связано с несовместимыми ограничениями. Вы можете ослабить некоторые правила или добавить дополнительные слоты времени.',
      icon: Lightbulb,
      category: 'Решение проблем',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      question: 'Можно ли редактировать сетку расписания вручную?',
      answer: 'Да, после автоматической генерации вы можете вручную корректировать УмноеРасписание. Система будет подсвечивать любые нарушения правил и предложит альтернативные варианты размещения уроков.',
      icon: Edit,
      category: 'Редактирование',
      color: 'from-green-500 to-emerald-500'
    },
    {
      question: 'Поддерживаются ли окна и лимиты уроков подряд?',
      answer: 'Конечно! Вы можете настроить максимальное количество уроков подряд для каждого класса, минимальные перерывы между уроками и ограничения на количество окон в расписании.',
      icon: Clock,
      category: 'Ограничения',
      color: 'from-purple-500 to-pink-500'
    },
    {
      question: 'Есть ли экспорт в PDF и Excel?',
      answer: 'Да, поддерживается экспорт в PDF для печати, Excel для дальнейшей обработки, а также публичные ссылки для доступа учителей и родителей к расписанию.',
      icon: FileText,
      category: 'Экспорт',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      question: 'Как работает пробный период и возврат средств?',
      answer: 'Пробный период длится 14 дней с полным доступом ко всем функциям. Если в течение 30 дней после оплаты вы не удовлетворены сервисом, мы вернём полную стоимость подписки.',
      icon: Shield,
      category: 'Гарантии',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      question: 'Можно ли перенести данные из другой системы?',
      answer: 'Да, поддерживается импорт из Excel/CSV файлов. Мы также можем помочь с миграцией данных из других систем планирования расписаний.',
      icon: Settings,
      category: 'Импорт',
      color: 'from-amber-500 to-orange-500'
    },
    {
      question: 'Обеспечивается ли безопасность данных?',
      answer: 'Все данные хранятся в защищённом облаке с шифрованием. Мы соблюдаем требования ФЗ-152 о персональных данных и регулярно проводим аудиты безопасности.',
      icon: Shield,
      category: 'Безопасность',
      color: 'from-red-500 to-pink-500'
    }
  ]

  const categories = Array.from(new Set(faqs.map(faq => faq.category)))

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 via-white to-gray-100" aria-labelledby="faq-heading">
      <div className="container-custom">
        {/* Заголовок с анимацией */}
        <div className={`text-center mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-6 shadow-xl">
            <HelpCircle className="w-10 h-10 text-white" aria-hidden="true" />
          </div>
          <h2 
            id="faq-heading"
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Часто задаваемые вопросы
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Ответы на самые популярные вопросы о нашем сервисе
          </p>
        </div>

        {/* FAQ контент */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className={`group transition-all duration-500 hover:scale-105 h-full ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                  {/* Заголовок вопроса */}
                  <button
                    onClick={() => handleToggle(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-gray-50 hover:to-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset transition-all duration-300 flex-1"
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Иконка категории */}
                      <div className={`w-12 h-12 bg-gradient-to-r ${faq.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <faq.icon className="w-6 h-6 text-white" aria-hidden="true" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Категория */}
                        <div className="text-xs font-medium text-primary-600 mb-1 uppercase tracking-wide">
                          {faq.category}
                        </div>
                        
                        {/* Вопрос */}
                        <h3 className="text-lg font-semibold text-gray-900 pr-4 leading-tight group-hover:text-primary-600 transition-colors duration-300">
                          {faq.question}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Иконка стрелки */}
                    <div className="flex-shrink-0 ml-4">
                      {openIndex === index ? (
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center transition-all duration-300">
                          <ChevronUp className="w-5 h-5 text-primary-600" aria-hidden="true" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-all duration-300">
                          <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-primary-600" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  </button>
                  
                  {/* Ответ с анимацией */}
                  <div 
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div 
                      id={`faq-answer-${index}`}
                      className="px-6 pb-6 border-t border-gray-100"
                      role="region"
                      aria-labelledby={`faq-question-${index}`}
                    >
                      <div className="pt-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-600 leading-relaxed text-base">
                            {faq.answer}
                          </p>
                        </div>
                        
                        {/* Дополнительная информация */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Zap className="w-4 h-4 text-yellow-500" />
                              <span>Быстрое решение</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Shield className="w-4 h-4 text-green-500" />
                              <span>Проверено</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Дополнительная информация внизу */}
        <div className={`text-center mt-20 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-8 text-white shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">
              Не нашли ответ на свой вопрос?
            </h3>
            <p className="text-primary-100 mb-6 text-lg">
              Наша команда поддержки готова помочь вам 24/7
            </p>
            <div className="flex justify-center">
              <button 
                onClick={() => onOpenAuth(window.location.pathname, false)}
                className="bg-white text-primary-600 hover:bg-gray-50 font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Написать в поддержку
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FAQ
