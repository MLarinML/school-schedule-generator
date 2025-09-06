'use client'

import { Check, AlertCircle, ChevronRight } from 'lucide-react'
import { Tab, TabType } from '../page'

interface ScheduleBuilderSidebarProps {
  tabs: Tab[]
  activeTab: TabType
  onTabChange: (tabId: TabType) => void
}

export const ScheduleBuilderSidebar = ({ 
  tabs, 
  activeTab, 
  onTabChange 
}: ScheduleBuilderSidebarProps) => {
  const getTabIcon = (tab: Tab) => {
    if (tab.hasErrors) {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }
    if (tab.completed) {
      return <Check className="w-4 h-4 text-green-500" />
    }
    return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
  }

  const getTabStyle = (tab: Tab) => {
    const baseStyle = "flex items-center justify-between p-4 rounded-lg transition-all duration-200 cursor-pointer"
    
    if (activeTab === tab.id) {
      return `${baseStyle} bg-primary-50 border border-primary-200 text-primary-700`
    }
    
    if (tab.hasErrors) {
      return `${baseStyle} bg-red-50 border border-red-200 text-red-700 hover:bg-red-100`
    }
    
    if (tab.completed) {
      return `${baseStyle} bg-green-50 border border-green-200 text-green-700 hover:bg-green-100`
    }
    
    return `${baseStyle} bg-white border border-gray-200 text-gray-700 hover:bg-gray-50`
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Этапы создания
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Пройдите все этапы для создания расписания
        </p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={getTabStyle(tab)}
          >
            <div className="flex items-center space-x-3">
              {getTabIcon(tab)}
              <span className="font-medium">{tab.title}</span>
            </div>
            
            {activeTab === tab.id && (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center space-x-2">
            <Check className="w-3 h-3 text-green-500" />
            <span>Завершено</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-3 h-3 text-red-500" />
            <span>Есть ошибки</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
            <span>Не начато</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
