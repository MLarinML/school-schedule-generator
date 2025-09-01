import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react'
import { smoothScrollToHref } from '../../lib/utils/smoothScroll'

const Footer = () => {
  const footerLinks = {
    product: [
      { name: 'Главная', href: '/#hero' },
      { name: 'Возможности', href: '/#features' },
      { name: 'Как это работает', href: '/#how-it-works' },
      { name: 'Отзывы', href: '/#testimonials' },
      { name: 'FAQ', href: '/#faq' },
      { name: 'Тарифы', href: '/subscription' }
    ],
    support: [
      { name: 'Поддержка', href: '/#faq' },
      { name: 'Документация', href: '/#how-it-works' },
      { name: 'Статус сервиса', href: '#status' }
    ],
    legal: [
      { name: 'Политика конфиденциальности', href: '#privacy' },
      { name: 'Публичная оферта', href: '#terms' },
      { name: 'Политика безопасности', href: '#security' },
      { name: 'Условия использования', href: '#usage' }
    ],
    company: [
      { name: 'О компании', href: '#about' },
      { name: 'Контакты', href: '#contact' },
      { name: 'Вакансии', href: '#careers' },
      { name: 'Партнёрам', href: '#partners' }
    ]
  }

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'support@raspisanie.ru',
      href: 'mailto:support@raspisanie.ru'
    },
    {
      icon: Phone,
      label: 'Телефон',
      value: '+7 (800) 555-01-23',
      href: 'tel:+78005550123'
    },
    {
      icon: MapPin,
      label: 'Адрес',
      value: 'Москва, ул. Примерная, д. 123',
      href: '#'
    }
  ]

  return (
    <footer className="bg-gray-900 text-white" role="contentinfo">
      <div className="container-custom py-16">
        <div className="grid lg:grid-cols-5 gap-8 mb-12">
          {/* Логотип и описание */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Р</span>
              </div>
              <span className="text-2xl font-bold">УмноеРасписание</span>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Автоматический генератор школьных расписаний с учётом всех ограничений и правил. 
              Создавайте корректные расписания за минуты, а не за дни.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="ВКонтакте"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.93 14.27h-1.46c-.55 0-.72-.44-1.71-1.42-.86-.86-1.24-.96-1.45-.96-.26 0-.33.09-.33.55v1.3c0 .39-.11.62-.39.62H11.5c-.21 0-.33-.11-.33-.33V9.72c0-.22.11-.33.33-.33h1.46c.22 0 .33.11.33.33v1.3c0 .55.28.66.33.66.11 0 .22-.05.44-.27.72-.72 1.42-1.71 1.42-1.71.11-.22.22-.33.44-.33h1.46c.22 0 .33.11.22.33-.11.22-1.42 2.75-1.42 2.75-.11.22-.11.33 0 .55.11.22.55.55.55.55.11.11.22.22.22.33v1.3c0 .22-.11.33-.33.33z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Telegram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Ссылки по категориям */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Продукт</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    onClick={(e) => {
                      if (link.href.includes('#')) {
                        e.preventDefault()
                        smoothScrollToHref(link.href)
                      }
                    }}
                    className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Поддержка</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    onClick={(e) => {
                      if (link.href.includes('#')) {
                        e.preventDefault()
                        smoothScrollToHref(link.href)
                      }
                    }}
                    className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Компания</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Контактная информация */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            {contactInfo.map((contact, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <contact.icon className="w-5 h-5 text-primary-400" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">{contact.label}</div>
                  <a 
                    href={contact.href}
                    className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-1"
                  >
                    {contact.value}
                    {contact.href.startsWith('http') && (
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    )}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Кнопка "Наверх" */}
        <div className="text-center mb-8">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
            aria-label="Прокрутить наверх"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>

        {/* Нижняя часть */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2024 Генератор школьных расписаний. Все права защищены.
            </div>
            
            <div className="flex space-x-6 text-sm">
              {footerLinks.legal.map((link) => (
                <a 
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
