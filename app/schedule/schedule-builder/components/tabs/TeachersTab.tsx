'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar, Search, Edit, X, Upload, FileSpreadsheet } from 'lucide-react'
import { useScheduleBuilder, Teacher } from '../../context/ScheduleBuilderContext'
import { TabType } from '../../page'
import * as XLSX from 'xlsx'

interface TeachersTabProps {
  onUpdateStatus: (tabId: TabType, completed: boolean, hasErrors?: boolean) => void
}

const DAYS_OF_WEEK = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'
]

const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8]

export const TeachersTab = ({ onUpdateStatus }: TeachersTabProps) => {
  const { data, addTeacher, removeTeacher, updateTeachers, updateTeacher, updateTeacherClassroom } = useScheduleBuilder()
  const [newTeacher, setNewTeacher] = useState({ firstName: '', lastName: '', middleName: '', classroomId: '' })
  const [newTeacherSubjects, setNewTeacherSubjects] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false)
  const [tempBlockers, setTempBlockers] = useState<Teacher['blockers']>({})
  const [tempSubjects, setTempSubjects] = useState<string[]>([])
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importedTeachers, setImportedTeachers] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<'delete' | 'assign_subjects' | 'edit_blockers' | null>(null)
  const [bulkSubjects, setBulkSubjects] = useState<string[]>([])
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [bulkBlockers, setBulkBlockers] = useState<Teacher['blockers']>({})
  
  // Состояние для показа инструкции импорта
  const [showImportInstructions, setShowImportInstructions] = useState(false)

  useEffect(() => {
    const hasTeachers = data.teachers.length > 0
    const hasErrors = data.teachers.some(teacher => 
      !teacher.firstName.trim() || !teacher.lastName.trim()
    )
    
    onUpdateStatus('teachers', hasTeachers && !hasErrors, hasErrors)
  }, [data.teachers]) // убираем onUpdateStatus из зависимостей


  const handleAddTeacher = () => {
    if (newTeacher.firstName.trim() && newTeacher.lastName.trim()) {
      const teacher: Teacher = {
        id: Date.now().toString(),
        firstName: newTeacher.firstName.trim(),
        lastName: newTeacher.lastName.trim(),
        middleName: newTeacher.middleName.trim() || undefined,
        subjects: newTeacherSubjects,
        classroomId: newTeacher.classroomId || undefined,
        blockers: {}
      }
      
      addTeacher(teacher)
      setNewTeacher({ firstName: '', lastName: '', middleName: '', classroomId: '' })
      setNewTeacherSubjects([])
    }
  }

  const handleRemoveTeacher = (id: string) => {
    setDeletingTeacherId(id)
    
    // Анимация удаления
    setTimeout(() => {
      removeTeacher(id)
      setDeletingTeacherId(null)
    }, 300) // Длительность анимации
  }

  const handleOpenTeacherModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setTempBlockers(teacher.blockers)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setSelectedTeacher(null)
    setTempBlockers({})
    setIsModalOpen(false)
  }

  const handleOpenSubjectModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setTempSubjects(teacher.subjects || [])
    setIsSubjectModalOpen(true)
  }

  const handleCloseSubjectModal = () => {
    setSelectedTeacher(null)
    setTempSubjects([])
    setIsSubjectModalOpen(false)
  }

  const handleSaveBlockers = () => {
    if (selectedTeacher) {
      const updatedTeacher = {
        ...selectedTeacher,
        blockers: tempBlockers
      }
      updateTeachers(data.teachers.map(t => t.id === selectedTeacher.id ? updatedTeacher : t))
      handleCloseModal()
    }
  }

  const handleSaveSubjects = () => {
    if (selectedTeacher) {
      const updatedTeacher = {
        ...selectedTeacher,
        subjects: tempSubjects
      }
      updateTeachers(data.teachers.map(t => t.id === selectedTeacher.id ? updatedTeacher : t))
      handleCloseSubjectModal()
    }
  }

  const toggleSubject = (subjectId: string) => {
    setTempSubjects(prev => 
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  const toggleFullDayBlock = (day: string) => {
    setTempBlockers(prev => ({
      ...prev,
      [day]: {
        fullDay: !prev[day]?.fullDay,
        lessons: prev[day]?.lessons || []
      }
    }))
  }

  const toggleLessonBlock = (day: string, lesson: number) => {
    const currentLessons = tempBlockers[day]?.lessons || []
    const updatedLessons = currentLessons.includes(lesson)
      ? currentLessons.filter(l => l !== lesson)
      : [...currentLessons, lesson]

    setTempBlockers(prev => ({
      ...prev,
      [day]: {
        fullDay: false,
        lessons: updatedLessons
      }
    }))
  }

  const getBlockedLessons = (day: string) => {
    return tempBlockers[day]?.lessons || []
  }

  const isFullDayBlocked = (day: string) => {
    return tempBlockers[day]?.fullDay || false
  }

  const toggleEighthLessonsBlock = () => {
    const newBlockers = { ...tempBlockers }
    
    DAYS_OF_WEEK.forEach(day => {
      if (!newBlockers[day]) {
        newBlockers[day] = { fullDay: false, lessons: [] }
      }
      
      const currentLessons = newBlockers[day].lessons || []
      const hasEighthLesson = currentLessons.includes(8)
      
      if (hasEighthLesson) {
        // Убираем 8-й урок из всех дней
        newBlockers[day] = {
          ...newBlockers[day],
          lessons: currentLessons.filter(l => l !== 8)
        }
      } else {
        // Добавляем 8-й урок во все дни
        newBlockers[day] = {
          ...newBlockers[day],
          lessons: [...currentLessons.filter(l => l !== 8), 8]
        }
      }
    })
    
    setTempBlockers(newBlockers)
  }

  const isEighthLessonsBlocked = () => {
    return DAYS_OF_WEEK.every(day => {
      const lessons = tempBlockers[day]?.lessons || []
      return lessons.includes(8)
    })
  }

  const getTeacherFullName = (teacher: Teacher) => {
    return `${teacher.lastName} ${teacher.firstName}${teacher.middleName ? ` ${teacher.middleName}` : ''}`
  }

  // Функция для получения названия кабинета по ID
  const getClassroomName = (classroomId?: string) => {
    if (!classroomId) return null
    const classroom = data.classrooms.find(c => c.id === classroomId)
    return classroom ? classroom.name : null
  }

  const getTeacherSubjects = (teacher: Teacher) => {
    if (!teacher.subjects || !Array.isArray(teacher.subjects)) {
      return []
    }
    return teacher.subjects.map(subjectId => {
      const subject = data.subjects.find(s => s.id === subjectId)
      return subject ? subject.name : 'Неизвестный предмет'
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Конвертируем в JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // Извлекаем ФИО из первого столбца
        const teachers = jsonData
          .map((row: any) => row[0]) // Берем первый столбец
          .filter((name: any) => name && typeof name === 'string' && name.trim()) // Фильтруем пустые и нестроковые значения
          .map((name: string) => name.trim()) // Убираем лишние пробелы
        
        setImportedTeachers(teachers)
        setIsImportModalOpen(true)
      } catch (error) {
        console.error('Ошибка при чтении файла:', error)
        alert('Ошибка при чтении Excel файла. Проверьте формат файла.')
      }
    }
    
    reader.readAsBinaryString(file)
  }

  const handleImportTeachers = () => {
    if (importedTeachers.length === 0) return

    setIsImporting(true)
    
    // Имитируем задержку для UX
    setTimeout(() => {
      const newTeachers: Teacher[] = importedTeachers.map((fullName, index) => {
        // Разбиваем ФИО на части
        const nameParts = fullName.split(' ').filter(part => part.trim())
        
        let firstName = ''
        let lastName = ''
        let middleName = ''
        
        if (nameParts.length === 1) {
          lastName = nameParts[0]
        } else if (nameParts.length === 2) {
          lastName = nameParts[0]
          firstName = nameParts[1]
        } else if (nameParts.length >= 3) {
          lastName = nameParts[0]
          firstName = nameParts[1]
          middleName = nameParts.slice(2).join(' ')
        }
        
        return {
          id: `imported-${Date.now()}-${index}`,
          firstName: firstName || 'Не указано',
          lastName: lastName || 'Не указано',
          middleName: middleName || undefined,
          subjects: [],
          classroomId: undefined,
          blockers: {}
        }
      })
      
      // Добавляем учителей
      newTeachers.forEach(teacher => {
        addTeacher(teacher)
      })
      
      setImportedTeachers([])
      setIsImportModalOpen(false)
      setIsImporting(false)
      
      alert(`Успешно импортировано ${newTeachers.length} учителей!`)
    }, 1000)
  }

  const handleCloseImportModal = () => {
    setImportedTeachers([])
    setIsImportModalOpen(false)
  }

  const handleSelectTeacher = (teacherId: string) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    )
  }

  const handleSelectAllTeachers = () => {
    const filteredTeachers = getFilteredTeachers()
    if (selectedTeachers.length === filteredTeachers.length) {
      setSelectedTeachers([])
    } else {
      setSelectedTeachers(filteredTeachers.map(t => t.id))
    }
  }

  const handleBulkDelete = () => {
    setBulkAction('delete')
    setIsBulkActionModalOpen(true)
  }

  const handleBulkAssignSubjects = () => {
    setBulkAction('assign_subjects')
    setBulkSubjects([])
    setIsBulkActionModalOpen(true)
  }

  const handleBulkEditBlockers = () => {
    setBulkAction('edit_blockers')
    setBulkBlockers({})
    setIsBulkActionModalOpen(true)
  }

  const handleDeleteAllTeachers = () => {
    if (confirm('Вы уверены, что хотите удалить ВСЕХ учителей? Это действие нельзя отменить.')) {
      data.teachers.forEach(teacher => {
        removeTeacher(teacher.id)
      })
      setSelectedTeachers([])
    }
  }

  const handleExecuteBulkAction = async () => {
    if (!bulkAction || selectedTeachers.length === 0) return

    setIsBulkProcessing(true)

    // Имитируем задержку для UX
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (bulkAction === 'delete') {
      selectedTeachers.forEach(teacherId => {
        removeTeacher(teacherId)
      })
      setSelectedTeachers([])
    } else if (bulkAction === 'assign_subjects') {
      const updatedTeachers = data.teachers.map(teacher => {
        if (selectedTeachers.includes(teacher.id)) {
          return {
            ...teacher,
            subjects: Array.from(new Set([...(teacher.subjects || []), ...bulkSubjects]))
          }
        }
        return teacher
      })
      updateTeachers(updatedTeachers)
    } else if (bulkAction === 'edit_blockers') {
      const updatedTeachers = data.teachers.map(teacher => {
        if (selectedTeachers.includes(teacher.id)) {
          return {
            ...teacher,
            blockers: { ...bulkBlockers }
          }
        }
        return teacher
      })
      updateTeachers(updatedTeachers)
    }

    setIsBulkProcessing(false)
    setIsBulkActionModalOpen(false)
    setBulkAction(null)
    setBulkSubjects([])
    setBulkBlockers({})
    setSelectedTeachers([])

    const actionText = bulkAction === 'delete' ? 'удалены' : 
                      bulkAction === 'assign_subjects' ? 'назначены предметы' : 
                      'обновлены блокеры'
    alert(`Успешно ${actionText} для ${selectedTeachers.length} учителей!`)
  }

  const handleCloseBulkActionModal = () => {
    setIsBulkActionModalOpen(false)
    setBulkAction(null)
    setBulkSubjects([])
    setBulkBlockers({})
  }

  const getFilteredTeachers = () => {
    return data.teachers.filter(teacher => {
      const fullName = getTeacherFullName(teacher).toLowerCase()
      return fullName.includes(searchQuery.toLowerCase())
    })
  }

  const toggleTeacherSubject = (teacherId: string, subjectId: string) => {
    const teacher = data.teachers.find(t => t.id === teacherId)
    if (!teacher) return

    const currentSubjects = teacher.subjects || []
    const updatedSubjects = currentSubjects.includes(subjectId)
      ? currentSubjects.filter(id => id !== subjectId)
      : [...currentSubjects, subjectId]

    const updatedTeacher = {
      ...teacher,
      subjects: updatedSubjects
    }

    updateTeachers(data.teachers.map(t => t.id === teacherId ? updatedTeacher : t))
  }

  const handleUpdateTeacherClassroom = (teacherId: string, classroomId: string) => {
    updateTeacherClassroom(teacherId, classroomId || undefined)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Управление учителями
        </h2>
        <p className="text-gray-600">
          Добавьте учителей и настройте их блокеры времени для корректной генерации расписания
        </p>
      </div>

      {/* Добавление нового учителя */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Добавить учителя
          </h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowImportInstructions(!showImportInstructions)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Upload className="w-4 h-4" />
              <span>Импорт из Excel</span>
            </button>
          </div>
          
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фамилия *
            </label>
            <input
              type="text"
              value={newTeacher.lastName}
              onChange={(e) => setNewTeacher(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Введите фамилию"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Имя *
            </label>
            <input
              type="text"
              value={newTeacher.firstName}
              onChange={(e) => setNewTeacher(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Введите имя"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Отчество
            </label>
            <input
              type="text"
              value={newTeacher.middleName}
              onChange={(e) => setNewTeacher(prev => ({ ...prev, middleName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Введите отчество"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Закрепленный кабинет
            </label>
            <select
              value={newTeacher.classroomId}
              onChange={(e) => setNewTeacher(prev => ({ ...prev, classroomId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Выберите кабинет</option>
              {data.classrooms.map(classroom => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Выбор предметов */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Предметы
            {newTeacherSubjects.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs font-semibold bg-primary-100 text-primary-800 rounded-full">
                {newTeacherSubjects.length} выбрано
              </span>
            )}
          </label>
          {data.subjects.length > 0 ? (
            <div>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setNewTeacherSubjects(data.subjects.map(s => s.id))}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Выбрать все
                </button>
                <button
                  type="button"
                  onClick={() => setNewTeacherSubjects([])}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Очистить все
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {data.subjects.map((subject) => (
                <label key={subject.id} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTeacherSubjects.includes(subject.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewTeacherSubjects(prev => [...prev, subject.id])
                      } else {
                        setNewTeacherSubjects(prev => prev.filter(id => id !== subject.id))
                      }
                    }}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{subject.name}</span>
                </label>
              ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Сначала добавьте предметы на вкладке "Предметы", чтобы назначить их учителю
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <button
            onClick={handleAddTeacher}
            disabled={!newTeacher.firstName.trim() || !newTeacher.lastName.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить учителя</span>
          </button>
        </div>
      </div>

      {/* Поиск учителей */}
      {data.teachers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Поиск по фамилии, имени или отчеству..."
            />
          </div>
        </div>
      )}

      {/* Панель массового управления */}
      {data.teachers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                Выбрано: {selectedTeachers.length} из {getFilteredTeachers().length}
              </span>
              <button
                onClick={handleSelectAllTeachers}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {selectedTeachers.length === getFilteredTeachers().length ? 'Снять выделение' : 'Выбрать всех'}
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDelete}
                disabled={selectedTeachers.length === 0}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Удалить выбранных
              </button>
              <button
                onClick={handleBulkAssignSubjects}
                disabled={selectedTeachers.length === 0}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Назначить предметы
              </button>
              <button
                onClick={handleBulkEditBlockers}
                disabled={selectedTeachers.length === 0}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Редактировать блокеры
              </button>
              <button
                onClick={handleDeleteAllTeachers}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить ВСЕХ учителей
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Компактный список учителей */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Список учителей ({getFilteredTeachers().length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {getFilteredTeachers().map((teacher) => (
            <div 
              key={teacher.id} 
              className={`p-4 hover:bg-gray-50 transition-all duration-300 ${
                deletingTeacherId === teacher.id 
                  ? 'animate-pulse bg-red-50 border-l-4 border-red-400 transform scale-95 opacity-50' 
                  : 'hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedTeachers.includes(teacher.id)}
                    onChange={() => handleSelectTeacher(teacher.id)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-sm">
                      {teacher.lastName.charAt(0)}{teacher.firstName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {getTeacherFullName(teacher)}
                    </h4>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>
                        {teacher.subjects && teacher.subjects.length > 0 
                          ? `Предметы: ${getTeacherSubjects(teacher).join(', ')}`
                          : 'Предметы не назначены'
                        }
                      </p>
                      <p>
                        {teacher.classroomId 
                          ? `Кабинет: ${getClassroomName(teacher.classroomId)}`
                          : 'Кабинет не закреплен'
                        }
                      </p>
                      <p>
                        {Object.keys(teacher.blockers).length > 0 
                          ? `Настроены блокеры на ${Object.keys(teacher.blockers).length} дн.`
                          : 'Блокеры не настроены'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenSubjectModal(teacher)}
                    className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Предметы</span>
                  </button>
                  
                  <button
                    onClick={() => handleOpenTeacherModal(teacher)}
                    className="flex items-center space-x-2 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Блокеры</span>
                  </button>
                  
                  <select
                    value={teacher.classroomId || ''}
                    onChange={(e) => handleUpdateTeacherClassroom(teacher.id, e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Кабинет</option>
                    {data.classrooms.map(classroom => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => handleRemoveTeacher(teacher.id)}
                    disabled={deletingTeacherId === teacher.id}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      deletingTeacherId === teacher.id
                        ? 'text-red-400 bg-red-100 cursor-not-allowed'
                        : 'text-red-600 hover:bg-red-50 hover:scale-105 active:scale-95'
                    }`}
                  >
                    <Trash2 className={`w-4 h-4 ${deletingTeacherId === teacher.id ? 'animate-spin' : ''}`} />
                    <span>{deletingTeacherId === teacher.id ? 'Удаление...' : 'Удалить'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.teachers.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Учителя не добавлены
          </h3>
          <p className="text-gray-600">
            Добавьте первого учителя, чтобы начать создание расписания
          </p>
        </div>
      )}

      {data.teachers.length > 0 && getFilteredTeachers().length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Учителя не найдены
          </h3>
          <p className="text-gray-600">
            Попробуйте изменить поисковый запрос
          </p>
        </div>
      )}

      {/* Модальное окно для настройки блокеров */}
      {isModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Настройка блокеров для {getTeacherFullName(selectedTeacher)}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Кнопка блокировки восьмых уроков */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Быстрая настройка
                    </h4>
                    <p className="text-xs text-blue-700">
                      Заблокировать 8-й урок во все дни недели
                    </p>
                  </div>
                  <button
                    onClick={toggleEighthLessonsBlock}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isEighthLessonsBlocked()
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {isEighthLessonsBlocked() ? 'Разблокировать 8-й урок' : 'Заблокировать 8-й урок'}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">{day}</h5>
                      
                      <button
                        onClick={() => toggleFullDayBlock(day)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                          isFullDayBlocked(day)
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {isFullDayBlocked(day) ? 'Весь день' : 'Весь день'}
                      </button>
                    </div>
                    
                    {!isFullDayBlocked(day) && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Заблокированные уроки:</p>
                        <div className="flex flex-wrap gap-1">
                          {LESSONS.map((lesson) => {
                            const isBlocked = getBlockedLessons(day).includes(lesson)
                            return (
                              <button
                                key={lesson}
                                onClick={() => toggleLessonBlock(day, lesson)}
                                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors duration-200 ${
                                  isBlocked
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {lesson}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveBlockers}
                className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors duration-200"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для выбора предметов */}
      {isSubjectModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Выбор предметов для {getTeacherFullName(selectedTeacher)}
                </h3>
                <button
                  onClick={handleCloseSubjectModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {data.subjects.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Предметы не созданы
                  </h4>
                  <p className="text-gray-600">
                    Сначала создайте предметы на вкладке "Предметы"
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Выберите предметы, которые преподает этот учитель:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.subjects.map((subject) => {
                      const isSelected = tempSubjects.includes(subject.id)
                      return (
                        <label
                          key={subject.id}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSubject(subject.id)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">
                              {subject.name}
                            </span>
                            {subject.difficulty && (
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                subject.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                subject.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {subject.difficulty === 'easy' ? 'Легкий' :
                                 subject.difficulty === 'medium' ? 'Средний' : 'Сложный'}
                              </span>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseSubjectModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveSubjects}
                disabled={data.subjects.length === 0}
                className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для импорта учителей */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Импорт учителей из Excel
                </h3>
                <button
                  onClick={handleCloseImportModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Найденные учителя ({importedTeachers.length})
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Проверьте список учителей перед импортом. ФИО будет автоматически разбито на фамилию, имя и отчество.
                </p>
              </div>
              
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                <div className="divide-y divide-gray-200">
                  {importedTeachers.map((teacher, index) => {
                    const nameParts = teacher.split(' ').filter(part => part.trim())
                    return (
                      <div key={index} className="p-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{teacher}</span>
                            <div className="text-xs text-gray-500 mt-1">
                              {nameParts.length === 1 && `Фамилия: ${nameParts[0]}`}
                              {nameParts.length === 2 && `Фамилия: ${nameParts[0]}, Имя: ${nameParts[1]}`}
                              {nameParts.length >= 3 && `Фамилия: ${nameParts[0]}, Имя: ${nameParts[1]}, Отчество: ${nameParts.slice(2).join(' ')}`}
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {importedTeachers.length === 0 && (
                <div className="text-center py-8">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Не найдено учителей для импорта</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseImportModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Отмена
              </button>
              <button
                onClick={handleImportTeachers}
                disabled={importedTeachers.length === 0 || isImporting}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Импорт...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Импортировать {importedTeachers.length} учителей</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для массовых действий */}
      {isBulkActionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {bulkAction === 'delete' ? 'Удаление учителей' : 
                   bulkAction === 'assign_subjects' ? 'Назначение предметов' : 
                   'Редактирование блокеров'}
                </h3>
                <button
                  onClick={handleCloseBulkActionModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {bulkAction === 'delete' ? (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Trash2 className="w-5 h-5 text-red-500 mr-2" />
                      <h4 className="text-lg font-medium text-red-900">
                        Подтверждение удаления
                      </h4>
                    </div>
                    <p className="text-red-700 mt-2">
                      Вы собираетесь удалить {selectedTeachers.length} учителей. Это действие нельзя отменить.
                    </p>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    <div className="divide-y divide-gray-200">
                      {selectedTeachers.map(teacherId => {
                        const teacher = data.teachers.find(t => t.id === teacherId)
                        if (!teacher) return null
                        return (
                          <div key={teacherId} className="p-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-gray-900">
                                  {getTeacherFullName(teacher)}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  {teacher.subjects && teacher.subjects.length > 0 
                                    ? `Предметы: ${getTeacherSubjects(teacher).join(', ')}`
                                    : 'Предметы не назначены'
                                  }
                                </div>
                              </div>
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : bulkAction === 'assign_subjects' ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Plus className="w-5 h-5 text-green-500 mr-2" />
                      <h4 className="text-lg font-medium text-green-900">
                        Назначение предметов
                      </h4>
                    </div>
                    <p className="text-green-700 mt-2">
                      Выберите предметы для назначения {selectedTeachers.length} учителям.
                    </p>
                  </div>
                  
                  {data.subjects.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setBulkSubjects(data.subjects.map(s => s.id))}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                          Выбрать все
                        </button>
                        <button
                          type="button"
                          onClick={() => setBulkSubjects([])}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                          Очистить все
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {data.subjects.map((subject) => (
                          <label key={subject.id} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={bulkSubjects.includes(subject.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBulkSubjects(prev => [...prev, subject.id])
                                } else {
                                  setBulkSubjects(prev => prev.filter(id => id !== subject.id))
                                }
                              }}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">{subject.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Сначала создайте предметы на вкладке "Предметы"
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                      <h4 className="text-lg font-medium text-blue-900">
                        Редактирование блокеров
                      </h4>
                    </div>
                    <p className="text-blue-700 mt-2">
                      Настройте блокеры времени для {selectedTeachers.length} учителей:
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        const newBlockers = { ...bulkBlockers }
                        
                        DAYS_OF_WEEK.forEach(day => {
                          if (!newBlockers[day]) {
                            newBlockers[day] = { fullDay: false, lessons: [] }
                          }
                          
                          const currentLessons = newBlockers[day].lessons || []
                          const hasEighthLesson = currentLessons.includes(8)
                          
                          if (hasEighthLesson) {
                            newBlockers[day] = {
                              ...newBlockers[day],
                              lessons: currentLessons.filter(l => l !== 8)
                            }
                          } else {
                            newBlockers[day] = {
                              ...newBlockers[day],
                              lessons: [...currentLessons, 8]
                            }
                          }
                        })
                        
                        setBulkBlockers(newBlockers)
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                        DAYS_OF_WEEK.every(day => bulkBlockers[day]?.lessons?.includes(8))
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {DAYS_OF_WEEK.every(day => bulkBlockers[day]?.lessons?.includes(8))
                        ? 'Разблокировать 8-е уроки'
                        : 'Заблокировать 8-е уроки'
                      }
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {DAYS_OF_WEEK.map((day, dayIndex) => (
                      <div key={day} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3">{day}</h5>
                        <div className="grid grid-cols-4 gap-2">
                          {LESSONS.map((lesson) => (
                            <label key={lesson} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={bulkBlockers[day]?.lessons?.includes(lesson) || false}
                                onChange={(e) => {
                                  const newBlockers = { ...bulkBlockers }
                                  if (!newBlockers[day]) {
                                    newBlockers[day] = { fullDay: false, lessons: [] }
                                  }
                                  
                                  const currentLessons = newBlockers[day].lessons || []
                                  if (e.target.checked) {
                                    newBlockers[day] = {
                                      ...newBlockers[day],
                                      lessons: [...currentLessons, lesson]
                                    }
                                  } else {
                                    newBlockers[day] = {
                                      ...newBlockers[day],
                                      lessons: currentLessons.filter(l => l !== lesson)
                                    }
                                  }
                                  
                                  setBulkBlockers(newBlockers)
                                }}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{lesson} урок</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseBulkActionModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Отмена
              </button>
              <button
                onClick={handleExecuteBulkAction}
                disabled={isBulkProcessing || (bulkAction === 'assign_subjects' && bulkSubjects.length === 0)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  bulkAction === 'delete'
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300'
                    : bulkAction === 'assign_subjects'
                    ? 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300'
                } disabled:cursor-not-allowed`}
              >
                {isBulkProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Обработка...</span>
                  </>
                ) : (
                  <>
                    {bulkAction === 'delete' ? (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Удалить {selectedTeachers.length} учителей</span>
                      </>
                    ) : bulkAction === 'assign_subjects' ? (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Назначить предметы {selectedTeachers.length} учителям</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Обновить блокеры {selectedTeachers.length} учителей</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно с инструкцией по импорту */}
      {showImportInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Upload className="w-6 h-6 mr-3 text-green-600" />
                Импорт учителей из Excel
              </h3>
              <button
                onClick={() => setShowImportInstructions(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Инструкция */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  📋 Инструкция по заполнению Excel файла
                </h4>
                <div className="text-sm text-blue-800 space-y-3">
                  <div>
                    <p className="font-semibold mb-2">Формат файла:</p>
                    <p>Поддерживаются форматы .xlsx и .xls</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-2">Структура таблицы:</p>
                    <ul className="ml-4 space-y-1">
                      <li>• <strong>Столбец A:</strong> ФИО учителя (например: "Иванов Иван Иванович")</li>
                      <li>• <strong>Столбец B:</strong> Пустой (не используется)</li>
                      <li>• <strong>Столбец C:</strong> Пустой (не используется)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-2">Пример заполнения:</p>
                    <div className="bg-white p-3 rounded border text-xs font-mono">
                      A1: Иванов Иван Иванович<br/>
                      A2: Петрова Мария Сергеевна<br/>
                      A3: Сидоров Алексей Владимирович
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-yellow-800 text-xs">
                      💡 <strong>Важно:</strong> Система автоматически разделит ФИО на фамилию, имя и отчество
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Кнопка загрузки файла */}
              <div className="text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="import-teachers-file"
                />
                <label
                  htmlFor="import-teachers-file"
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 cursor-pointer text-lg font-medium shadow-lg hover:shadow-xl"
                >
                  <Upload className="w-6 h-6" />
                  <span>Выбрать файл для загрузки</span>
                </label>
                <p className="text-sm text-gray-500 mt-3">
                  Нажмите для выбора Excel файла с данными учителей
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
