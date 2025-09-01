'use client'

import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Calendar, Clock, Settings, Users, FileText } from 'lucide-react'

export default function SchedulePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/?auth=login')
    }
  }, [user, isLoading, router])

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-custom py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Составление расписания
          </h1>
          <p className="text-xl text-gray-600">
            Создавайте и редактируйте школьные расписания с учётом всех ограничений
          </p>
        </div>
      </div>

      {/* Основной контент */}
      <div className="container-custom py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-12 h-12 text-primary-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Раздел в разработке
          </h2>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Здесь будет редактор и генерация расписаний. Мы работаем над созданием удобного интерфейса для составления школьных расписаний с учётом всех ваших потребностей.
          </p>

          {/* Планируемые функции */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Управление классами</h3>
              <p className="text-sm text-gray-600">Добавление и редактирование классов</p>
            </div>

            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Генерация расписания</h3>
              <p className="text-sm text-gray-600">Автоматическое создание расписаний</p>
            </div>

            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Настройка правил</h3>
              <p className="text-sm text-gray-600">Гибкая настройка ограничений</p>
            </div>

            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Экспорт данных</h3>
              <p className="text-sm text-gray-600">Выгрузка в различных форматах</p>
            </div>
          </div>

          {/* Информация о прогрессе */}
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Что уже готово
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Система аутентификации</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>База данных пользователей</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>API для работы с данными</span>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/subscription"
              className="btn-primary px-8 py-3"
            >
              Перейти к подписке
            </a>
            <a
              href="/account"
              className="btn-secondary px-8 py-3"
            >
              Настройки аккаунта
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

