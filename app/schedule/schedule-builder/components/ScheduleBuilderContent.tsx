'use client'

import { TabType } from '../page'
import { ImportTab } from './tabs/ImportTab'
import { TeachersTab } from './tabs/TeachersTab'
import { ClassroomsTab } from './tabs/ClassroomsTab'
import { SubjectsTab } from './tabs/SubjectsTab'
import ClassesTab from './tabs/ClassesTab'
import { GenerationTab } from './tabs/GenerationTab'

interface ScheduleBuilderContentProps {
  activeTab: TabType
  onUpdateTabStatus: (tabId: TabType, completed: boolean, hasErrors?: boolean) => void
}

export const ScheduleBuilderContent = ({ 
  activeTab, 
  onUpdateTabStatus 
}: ScheduleBuilderContentProps) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'import':
        return <ImportTab onUpdateStatus={onUpdateTabStatus} />
      case 'teachers':
        return <TeachersTab onUpdateStatus={onUpdateTabStatus} />
      case 'classrooms':
        return <ClassroomsTab onUpdateStatus={onUpdateTabStatus} />
      case 'subjects':
        return <SubjectsTab onUpdateStatus={onUpdateTabStatus} />
      case 'classes':
        return <ClassesTab onUpdateStatus={onUpdateTabStatus} />
      case 'generation':
        return <GenerationTab onUpdateStatus={onUpdateTabStatus} />
      default:
        return <TeachersTab onUpdateStatus={onUpdateTabStatus} />
    }
  }

  return (
    <main className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </main>
  )
}
