'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { AuthModal } from '../../../components/auth'
import { ScheduleBuilderProvider } from './context/ScheduleBuilderContext'
import { ScheduleBuilderSidebar } from './components/ScheduleBuilderSidebar'
import { ScheduleBuilderContent } from './components/ScheduleBuilderContent'
import { ScheduleBuilderHeader } from './components/ScheduleBuilderHeader'

export type TabType = 'import' | 'teachers' | 'classrooms' | 'subjects' | 'classes' | 'generation'

export interface Tab {
  id: TabType
  title: string
  completed: boolean
  hasErrors: boolean
}

const tabs: Tab[] = [
  { id: 'import', title: 'Импорт', completed: false, hasErrors: false },
  { id: 'subjects', title: 'Предметы', completed: false, hasErrors: false },
  { id: 'classrooms', title: 'Кабинеты', completed: false, hasErrors: false },
  { id: 'teachers', title: 'Учителя', completed: false, hasErrors: false },
  { id: 'classes', title: 'Классы и нагрузки', completed: false, hasErrors: false },
  { id: 'generation', title: 'Просмотр и генерация', completed: false, hasErrors: false }
]

export default function ScheduleBuilderPage() {
  const { user, isLoading, isAuthModalOpen, closeAuthModal, returnTo, checkoutIntent, openAuthModal } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('import')
  const [tabsState, setTabsState] = useState<Tab[]>(tabs)

  const handleTabChange = useCallback((tabId: TabType) => {
    setActiveTab(tabId)
  }, [])

  const updateTabStatus = useCallback((tabId: TabType, completed: boolean, hasErrors: boolean = false) => {
    setTabsState(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, completed, hasErrors } : tab
    ))
  }, [])

  // Показываем загрузку во время проверки авторизации
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  // Если пользователь не авторизован, показываем сообщение с предложением войти
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Доступ ограничен</h1>
            <p className="text-gray-600">
              Для использования конструктора расписания необходимо войти в систему
            </p>
          </div>
          <button 
            onClick={() => {
              openAuthModal('/schedule/schedule-builder')
            }}
            className="btn-primary"
          >
            Войти в систему
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <ScheduleBuilderProvider>
        <div className="h-screen flex flex-col bg-gray-50">
          <ScheduleBuilderHeader />
          
          <div className="flex-1 flex overflow-hidden">
            <ScheduleBuilderSidebar 
              tabs={tabsState}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
            
            <ScheduleBuilderContent 
              activeTab={activeTab}
              onUpdateTabStatus={updateTabStatus}
            />
          </div>
        </div>
      </ScheduleBuilderProvider>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        returnTo={returnTo}
        checkoutIntent={checkoutIntent}
      />
    </>
  )
}
