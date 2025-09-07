'use client'

import { Calendar, Home } from 'lucide-react'

export const ScheduleBuilderHeader = () => {
  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Конструктор расписания школы
          </h1>
          <p className="text-sm text-gray-500">
            Создание и настройка школьного расписания
          </p>
        </div>
      </div>
      
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault()
          handleGoHome()
        }}
        className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer relative z-10"
        aria-label="Перейти на главную страницу"
      >
        <Home className="w-4 h-4" />
        <span>На главную</span>
      </a>
    </header>
  )
}
