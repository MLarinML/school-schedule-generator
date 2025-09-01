'use client'

import { useState } from 'react'
import { Menu, X, User, LogOut, Settings, Calendar } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { smoothScrollToHref } from '../../lib/utils/smoothScroll'

interface HeaderProps {
  onOpenAuth: (returnTo?: string, checkoutIntent?: boolean) => void
}

const Header = ({ onOpenAuth }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleToggleAccountMenu = () => {
    setIsAccountMenuOpen(!isAccountMenuOpen)
  }

  const handleClickOutside = () => {
    setIsAccountMenuOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleToggleMenu()
    }
  }

  const navigationItems = [
    { name: 'Главная', href: '/#hero' },
    { name: 'Возможности', href: '/#features' },
    { name: 'Как это работает', href: '/#how-it-works' },
    { name: 'Отзывы', href: '/#testimonials' },
    { name: 'FAQ', href: '/#faq' },
    { name: 'Цены', href: '/subscription' },
    ...(user ? [{ name: 'УмноеРасписание', href: '/schedule' }] : []),
  ]

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50" role="banner">
      <nav className="container-custom" aria-label="Главная навигация">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <div className="flex-shrink-0">
            <a 
              href="/" 
              className="flex items-center space-x-2 text-xl font-bold text-primary-600"
              aria-label="Главная страница - Генератор школьных расписаний"
            >
              <div className="relative w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                {/* Основной календарь */}
                <svg className="w-5 h-5 text-white z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {/* Стрелки автоматизации */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <span>УмноеРасписание</span>
            </a>
          </div>

          {/* Десктопная навигация */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href.includes('#')) {
                      e.preventDefault()
                      try {
                        smoothScrollToHref(item.href)
                      } catch (error) {
                        console.warn('Navigation error:', error)
                        // Fallback: обычный переход
                        window.location.href = item.href
                      }
                    }
                  }}
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* Кнопки входа */}
          <div className="hidden md:block flex items-center space-x-4">
            
            {user ? (
              <div className="relative">
                <button
                  onClick={handleToggleAccountMenu}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  aria-label="Меню аккаунта"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user.firstName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-700 font-medium">{user.firstName}</span>
                </button>
                
                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <a
                      href="/account"
                      className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Аккаунт</span>
                    </a>
                    <a
                      href="/subscription"
                      className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Подписка</span>
                    </a>
                    <button
                      onClick={logout}
                      className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Выйти</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => onOpenAuth(window.location.pathname, false)}
                className="btn-primary"
              >
                Войти
              </button>
            )}
          </div>

          {/* Мобильная кнопка меню */}
          <div className="md:hidden">
            <button
              onClick={handleToggleMenu}
              onKeyDown={handleKeyDown}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Открыть меню"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {isMenuOpen && (
          <div 
            className="md:hidden" 
            id="mobile-menu"
            role="navigation"
            aria-label="Мобильная навигация"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href.includes('#')) {
                      e.preventDefault()
                      try {
                        smoothScrollToHref(item.href)
                      } catch (error) {
                        console.warn('Mobile navigation error:', error)
                        // Fallback: обычный переход
                        window.location.href = item.href
                      }
                    }
                    setIsMenuOpen(false)
                  }}
                  className="text-gray-700 hover:text-primary-600 block px-3 py-2 text-base font-medium cursor-pointer"
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 space-y-3">
                
                {user ? (
                  <>
                    <a
                      href="/account"
                      className="flex items-center justify-center space-x-2 px-4 py-2 text-gray-700 hover:text-primary-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Аккаунт</span>
                    </a>
                    <a
                      href="/subscription"
                      className="flex items-center justify-center space-x-2 px-4 py-2 text-gray-700 hover:text-primary-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Подписка</span>
                    </a>
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false)
                        logout()
                      }}
                      className="flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors duration-200 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Выйти</span>
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false)
                      onOpenAuth(window.location.pathname, false)
                    }}
                    className="btn-primary w-full"
                  >
                    Войти
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
