'use client'

import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User, Settings, Shield, Building, LogOut } from 'lucide-react'
import { Header } from '../../components/layout'

type TabType = 'overview' | 'profile' | 'security'

export default function AccountPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isLoadingAction, setIsLoadingAction] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Состояние для формы смены пароля
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Состояние для формы профиля
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    schoolName: user?.schoolName || '',
    language: 'ru'
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/?auth=login')
    }
  }, [user, isLoading, router])

  // Обновляем форму профиля при изменении пользователя
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        schoolName: user.schoolName || '',
        language: 'ru'
      })
    }
  }, [user])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          schoolName: profileForm.schoolName,
          language: profileForm.language
        })
      })

      const data = await response.json()

      if (response.ok) {
        showMessage('success', 'Профиль успешно обновлён!')
        // Обновляем данные пользователя в контексте
        // Это заставит компонент перерендериться с новыми данными
        window.location.reload()
      } else {
        showMessage('error', data.error || 'Ошибка при обновлении профиля')
      }
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error)
      showMessage('error', 'Произошла ошибка при обновлении профиля')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Валидация
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showMessage('error', 'Все поля обязательны для заполнения')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'Новые пароли не совпадают')
      return
    }

    if (passwordForm.newPassword.length < 10) {
      showMessage('error', 'Новый пароль должен содержать не менее 10 символов')
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        showMessage('success', 'Пароль успешно изменён')
        // Очищаем форму
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        showMessage('error', data.error || 'Ошибка при смене пароля')
      }
    } catch (error) {
      console.error('Ошибка при смене пароля:', error)
      showMessage('error', 'Произошла ошибка при смене пароля')
    } finally {
      setIsChangingPassword(false)
    }
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
      <Header onOpenAuth={() => {}} />
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
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Пользователь'}
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

                  {/* Детальная информация профиля */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Детальная информация</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Личная информация</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Имя:</span>
                            <span className="font-medium">{user.firstName || 'Не указано'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Фамилия:</span>
                            <span className="font-medium">{user.lastName || 'Не указано'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Название учебного заведения:</span>
                            <span className="font-medium">{user.schoolName || 'Не указано'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Email:</span>
                            <span className="font-medium">{user.email}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Статистика аккаунта</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Статус email:</span>
                            <span className={`font-medium ${user.isEmailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                              {user.isEmailVerified ? 'Подтверждён' : 'Не подтверждён'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Дата регистрации:</span>
                            <span className="font-medium">{formatDate(user.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Последний вход:</span>
                            <span className="font-medium">{formatDate(user.lastSeenAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">ID пользователя:</span>
                            <span className="font-medium text-xs text-gray-400">{user.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Вкладка: Профиль */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Профиль</h2>
                  
                  <form onSubmit={handleProfileSave} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Имя
                        </label>
                        <input
                          type="text"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Фамилия
                        </label>
                        <input
                          type="text"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Язык интерфейса
                      </label>
                      <select 
                        value={profileForm.language}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="ru">Русский</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    {/* Организация */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Учебное заведение</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Название школы
                          </label>
                          <input
                            type="text"
                            value={profileForm.schoolName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, schoolName: e.target.value }))}
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
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className={`btn-primary px-8 py-3 ${isSavingProfile ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSavingProfile ? 'Сохраняем...' : 'Сохранить изменения'}
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
                      
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Текущий пароль
                          </label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Новый пароль
                          </label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
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
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className={`btn-primary px-6 py-3 ${isChangingPassword ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isChangingPassword ? 'Меняем пароль...' : 'Сменить пароль'}
                        </button>
                      </form>
                    </div>


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

