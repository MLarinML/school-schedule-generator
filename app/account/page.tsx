'use client'

import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User, Settings, Shield, Building, Bell, Mail, Calendar, LogOut } from 'lucide-react'

type TabType = 'overview' | 'profile' | 'security' | 'organization'

export default function AccountPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isLoadingAction, setIsLoadingAction] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/?auth=login')
    }
  }, [user, isLoading, router])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const tabs = [
    { id: 'overview', name: 'Обзор', icon: User },
    { id: 'profile', name: 'Профиль', icon: Settings },
    { id: 'security', name: 'Безопасность', icon: Shield },
    { id: 'organization', name: 'Организация', icon: Building },
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-custom py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Настройки аккаунта
          </h1>
          <p className="text-xl text-gray-600">
            Управляйте своим профилем, безопасностью и настройками
          </p>
        </div>
      </div>

      {/* Основной контент */}
      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Боковая панель с вкладками */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700 border border-primary-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  )
                })}
              </nav>

              {/* Кнопка выхода */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Выйти</span>
                </button>
              </div>
            </div>
          </div>

          {/* Содержимое вкладок */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              {/* Сообщения */}
              {message && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Вкладка: Обзор */}
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Обзор профиля</h2>
                  
                  {/* Карточка пользователя */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">
                          {user.firstName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-gray-600">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className={`w-2 h-2 rounded-full ${
                            user.isEmailVerified ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <span className="text-sm text-gray-600">
                            {user.isEmailVerified ? 'Email подтверждён' : 'Email не подтверждён'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Дата регистрации:</span>
                        <p className="font-medium">{formatDate(user.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Последний вход:</span>
                        <p className="font-medium">{formatDate(user.lastSeenAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Быстрые действия */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <span>Изменить почту</span>
                      </button>
                      <a
                        href="/subscription"
                        className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Calendar className="w-5 h-5 text-green-600" />
                        <span>Управление подпиской</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Вкладка: Профиль */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Профиль</h2>
                  
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Имя
                        </label>
                        <input
                          type="text"
                          defaultValue={user.firstName}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Фамилия
                        </label>
                        <input
                          type="text"
                          defaultValue={user.lastName}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Язык интерфейса
                      </label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                        <option value="ru">Русский</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary px-8 py-3"
                      onClick={(e) => {
                        e.preventDefault()
                        showMessage('success', 'Настройки сохранены')
                      }}
                    >
                      Сохранить изменения
                    </button>
                  </form>
                </div>
              )}

              {/* Вкладка: Безопасность */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Безопасность</h2>
                  
                  <div className="space-y-8">
                    {/* Смена пароля */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Смена пароля</h3>
                      
                      <form className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Текущий пароль
                          </label>
                          <input
                            type="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Новый пароль
                          </label>
                          <input
                            type="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            Не менее 10 символов, включая заглавные и строчные буквы, цифры и специальные символы
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Подтверждение нового пароля
                          </label>
                          <input
                            type="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>

                        <button
                          type="submit"
                          className="btn-primary px-6 py-3"
                          onClick={(e) => {
                            e.preventDefault()
                            showMessage('success', 'Пароль обновлён')
                          }}
                        >
                          Сменить пароль
                        </button>
                      </form>
                    </div>

                    {/* Дополнительная безопасность */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Дополнительная безопасность</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Двухфакторная аутентификация</h4>
                            <p className="text-sm text-gray-600">Дополнительный уровень защиты аккаунта</p>
                          </div>
                          <button className="btn-secondary px-4 py-2">
                            Настроить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Вкладка: Организация */}
              {activeTab === 'organization' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Учебное заведение</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Название школы
                      </label>
                      <input
                        type="text"
                        placeholder="Введите название вашей школы"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Building className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Информация о подписке</h4>
                          <p className="text-sm text-blue-700">
                            Управление подпиской находится в разделе{' '}
                            <a href="/subscription" className="underline hover:text-blue-800">
                              Подписка
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary px-8 py-3"
                      onClick={() => showMessage('success', 'Информация об организации сохранена')}
                    >
                      Сохранить изменения
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

