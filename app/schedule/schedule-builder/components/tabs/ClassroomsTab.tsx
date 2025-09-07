'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Search, Building2, Users, BookOpen, Edit, X, CheckCircle, Upload, FileSpreadsheet } from 'lucide-react'
import { useScheduleBuilder, Classroom } from '../../context/ScheduleBuilderContext'
import { TabType } from '../../page'
import * as XLSX from 'xlsx'

interface ClassroomsTabProps {
  onUpdateStatus: (tabId: TabType, completed: boolean, hasErrors?: boolean) => void
}

const CLASSROOM_TYPES = [
  'Обычный кабинет',
  'Компьютерный класс',
  'Лаборатория',
  'Спортивный зал',
  'Актовый зал',
  'Библиотека',
  'Мастерская'
]

export const ClassroomsTab = ({ onUpdateStatus }: ClassroomsTabProps) => {
  const { data, addClassroom, removeClassroom, updateClassrooms, updateTeacherClassroom } = useScheduleBuilder()
  const [newClassroom, setNewClassroom] = useState({
    name: '',
    type: '',
    capacity: '',
    subject: '',
    teacherId: '',
    supportedSubjects: [] as string[]
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingClassroomId, setDeletingClassroomId] = useState<string | null>(null)
  const [editingClassroomId, setEditingClassroomId] = useState<string | null>(null)
  const [editClassroom, setEditClassroom] = useState({
    name: '',
    type: '',
    capacity: '',
    subject: '',
    teacherId: '',
    supportedSubjects: [] as string[]
  })
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importedClassrooms, setImportedClassrooms] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>([])
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<'delete' | null>(null)
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  
  // Состояние для показа инструкции импорта
  const [showImportInstructions, setShowImportInstructions] = useState(false)

  useEffect(() => {
    const hasClassrooms = data.classrooms.length > 0
    const hasErrors = data.classrooms.some(classroom => !classroom.name.trim())
    
    onUpdateStatus('classrooms', hasClassrooms && !hasErrors, hasErrors)
  }, [data.classrooms]) // убираем onUpdateStatus из зависимостей

  const handleAddClassroom = () => {
    if (newClassroom.name.trim()) {
      const classroom: Classroom = {
        id: Date.now().toString(),
        name: newClassroom.name.trim(),
        type: newClassroom.type || undefined,
        capacity: newClassroom.capacity ? parseInt(newClassroom.capacity) : undefined,
        subject: newClassroom.subject || undefined,
        teacherId: newClassroom.teacherId || undefined,
        supportedSubjects: newClassroom.supportedSubjects.length > 0 ? newClassroom.supportedSubjects : undefined
      }
      
      addClassroom(classroom)
      setNewClassroom({ name: '', type: '', capacity: '', subject: '', teacherId: '', supportedSubjects: [] })
    }
  }

  const handleRemoveClassroom = (id: string) => {
    setDeletingClassroomId(id)
    
    // Анимация удаления
    setTimeout(() => {
      removeClassroom(id)
      setDeletingClassroomId(null)
    }, 300) // Длительность анимации
  }

  const handleEditClassroom = (classroom: Classroom) => {
    setEditingClassroomId(classroom.id)
    setEditClassroom({
      name: classroom.name,
      type: classroom.type || '',
      capacity: classroom.capacity?.toString() || '',
      subject: classroom.subject || '',
      teacherId: classroom.teacherId || '',
      supportedSubjects: classroom.supportedSubjects || []
    })
  }

  const handleSaveEdit = () => {
    if (editClassroom.name.trim() && editingClassroomId) {
      const updatedClassroom: Classroom = {
        id: editingClassroomId,
        name: editClassroom.name.trim(),
        type: editClassroom.type || undefined,
        capacity: editClassroom.capacity ? parseInt(editClassroom.capacity) : undefined,
        subject: editClassroom.subject || undefined,
        teacherId: editClassroom.teacherId || undefined,
        supportedSubjects: editClassroom.supportedSubjects.length > 0 ? editClassroom.supportedSubjects : undefined
      }
      
      updateClassrooms(data.classrooms.map(c => 
        c.id === editingClassroomId ? updatedClassroom : c
      ))
      
      setEditingClassroomId(null)
      setEditClassroom({ name: '', type: '', capacity: '', subject: '', teacherId: '', supportedSubjects: [] })
    }
  }

  const handleCancelEdit = () => {
    setEditingClassroomId(null)
    setEditClassroom({ name: '', type: '', capacity: '', subject: '', teacherId: '', supportedSubjects: [] })
  }

  const filteredClassrooms = data.classrooms
    .filter(classroom =>
      classroom.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Извлекаем числа из названий кабинетов
      const aNumber = a.name.match(/(\d+)/)?.[1]
      const bNumber = b.name.match(/(\d+)/)?.[1]
      
      // Если оба содержат числа, сортируем по числам
      if (aNumber && bNumber) {
        return parseInt(aNumber) - parseInt(bNumber)
      }
      
      // Если только один содержит число, он идет первым
      if (aNumber && !bNumber) return -1
      if (!aNumber && bNumber) return 1
      
      // Если оба не содержат числа, сортируем по алфавиту
      return a.name.localeCompare(b.name, 'ru')
    })

  // Функция для получения имени учителя по ID
  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return null
    const teacher = data.teachers.find(t => t.id === teacherId)
    if (!teacher) return null
    return `${teacher.lastName} ${teacher.firstName} ${teacher.middleName || ''}`.trim()
  }

  // Функция для получения названия предмета по ID
  const getSubjectName = (subjectId: string) => {
    const subject = data.subjects.find(s => s.id === subjectId)
    return subject ? subject.name : subjectId
  }

  // Функция для переключения поддерживаемого предмета
  const toggleSupportedSubject = (subjectId: string) => {
    setNewClassroom(prev => ({
      ...prev,
      supportedSubjects: prev.supportedSubjects.includes(subjectId)
        ? prev.supportedSubjects.filter(id => id !== subjectId)
        : [...prev.supportedSubjects, subjectId]
    }))
  }

  // Функция для переключения поддерживаемого предмета в режиме редактирования
  const toggleEditSupportedSubject = (subjectId: string) => {
    setEditClassroom(prev => ({
      ...prev,
      supportedSubjects: prev.supportedSubjects.includes(subjectId)
        ? prev.supportedSubjects.filter(id => id !== subjectId)
        : [...prev.supportedSubjects, subjectId]
    }))
  }

  // Функция для обновления закрепленного учителя кабинета с двусторонней синхронизацией
  const handleUpdateClassroomTeacher = (classroomId: string, teacherId: string) => {
    // Обновляем кабинет
    const updatedClassrooms = data.classrooms.map(c => 
      c.id === classroomId ? { ...c, teacherId: teacherId || undefined } : c
    )
    updateClassrooms(updatedClassrooms)

    // Обновляем учителей (убираем закрепление у других учителей для этого кабинета)
    if (teacherId) {
      updateTeacherClassroom(teacherId, classroomId)
    } else {
      // Убираем закрепление кабинета у всех учителей
      const classroom = data.classrooms.find(c => c.id === classroomId)
      if (classroom?.teacherId) {
        updateTeacherClassroom(classroom.teacherId, undefined)
      }
    }
  }

  // Группируем аудитории по десяткам
  const groupClassroomsByTens = (classrooms: typeof filteredClassrooms) => {
    const groups: {[key: string]: typeof filteredClassrooms} = {}
    
    classrooms.forEach(classroom => {
      // Извлекаем номер из названия аудитории
      const match = classroom.name.match(/(\d+)/)
      if (match) {
        const number = parseInt(match[1])
        const tens = Math.floor(number / 10) * 10
        const groupKey = `${tens}-${tens + 9}`
        
        if (!groups[groupKey]) {
          groups[groupKey] = []
        }
        groups[groupKey].push(classroom)
      } else {
        // Если нет номера, помещаем в группу "Другие"
        if (!groups['Другие']) {
          groups['Другие'] = []
        }
        groups['Другие'].push(classroom)
      }
    })
    
    // Сортируем группы по номерам
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Другие') return 1
      if (b === 'Другие') return -1
      return parseInt(a.split('-')[0]) - parseInt(b.split('-')[0])
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
        
        // Извлекаем названия кабинетов из первого столбца
        const classrooms = jsonData
          .map((row: any) => row[0]) // Берем первый столбец
          .filter((name: any) => name && typeof name === 'string' && name.trim()) // Фильтруем пустые и нестроковые значения
          .map((name: string) => name.trim()) // Убираем лишние пробелы
        
        setImportedClassrooms(classrooms)
        setIsImportModalOpen(true)
      } catch (error) {
        console.error('Ошибка при чтении файла:', error)
        alert('Ошибка при чтении Excel файла. Проверьте формат файла.')
      }
    }
    
    reader.readAsBinaryString(file)
  }

  const handleImportClassrooms = () => {
    if (importedClassrooms.length === 0) return

    setIsImporting(true)
    
    // Имитируем задержку для UX
    setTimeout(() => {
      const newClassrooms: Classroom[] = importedClassrooms.map((name, index) => {
        return {
          id: `imported-${Date.now()}-${index}`,
          name: name,
          type: 'Обычный кабинет',
          capacity: 30,
          subject: '',
          supportedSubjects: []
        }
      })
      
      // Добавляем кабинеты
      newClassrooms.forEach(classroom => {
        addClassroom(classroom)
      })
      
      setImportedClassrooms([])
      setIsImportModalOpen(false)
      setIsImporting(false)
      
      alert(`Успешно импортировано ${newClassrooms.length} кабинетов!`)
    }, 1000)
  }

  const handleCloseImportModal = () => {
    setImportedClassrooms([])
    setIsImportModalOpen(false)
  }

  const handleSelectClassroom = (classroomId: string) => {
    setSelectedClassrooms(prev => 
      prev.includes(classroomId) 
        ? prev.filter(id => id !== classroomId)
        : [...prev, classroomId]
    )
  }

  const handleSelectAllClassrooms = () => {
    const filteredClassrooms = data.classrooms.filter(classroom =>
      classroom.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (selectedClassrooms.length === filteredClassrooms.length) {
      setSelectedClassrooms([])
    } else {
      setSelectedClassrooms(filteredClassrooms.map(c => c.id))
    }
  }

  const handleBulkDelete = () => {
    setBulkAction('delete')
    setIsBulkActionModalOpen(true)
  }

  const handleDeleteAllClassrooms = () => {
    if (confirm('Вы уверены, что хотите удалить ВСЕ кабинеты? Это действие нельзя отменить.')) {
      data.classrooms.forEach(classroom => {
        removeClassroom(classroom.id)
      })
      setSelectedClassrooms([])
    }
  }

  const handleExecuteBulkAction = async () => {
    if (!bulkAction || selectedClassrooms.length === 0) return

    setIsBulkProcessing(true)

    // Имитируем задержку для UX
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (bulkAction === 'delete') {
      selectedClassrooms.forEach(classroomId => {
        removeClassroom(classroomId)
      })
      setSelectedClassrooms([])
    }

    setIsBulkProcessing(false)
    setIsBulkActionModalOpen(false)
    setBulkAction(null)

    const actionText = bulkAction === 'delete' ? 'удалены' : 'обновлены'
    alert(`Успешно ${actionText} ${selectedClassrooms.length} кабинетов!`)
  }

  const handleCloseBulkActionModal = () => {
    setIsBulkActionModalOpen(false)
    setBulkAction(null)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Управление кабинетами
        </h2>
        <p className="text-gray-600">
          Добавьте кабинеты и аудитории для размещения уроков в расписании
        </p>
      </div>

      {/* Добавление нового кабинета */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Добавить кабинет
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название кабинета *
            </label>
            <input
              type="text"
              value={newClassroom.name}
              onChange={(e) => setNewClassroom(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Например: 101, 2А, Лаб. физики"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип кабинета
            </label>
            <select
              value={newClassroom.type}
              onChange={(e) => setNewClassroom(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Выберите тип</option>
              {CLASSROOM_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Вместимость
            </label>
            <input
              type="number"
              value={newClassroom.capacity}
              onChange={(e) => setNewClassroom(prev => ({ ...prev, capacity: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Количество мест"
              min="1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Профильный предмет
            </label>
            <input
              type="text"
              value={newClassroom.subject}
              onChange={(e) => setNewClassroom(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Например: Математика"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Закрепленный учитель
            </label>
            <select
              value={newClassroom.teacherId}
              onChange={(e) => setNewClassroom(prev => ({ ...prev, teacherId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Закрепить учителя</option>
              {data.teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.lastName} {teacher.firstName} {teacher.middleName || ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Поддерживаемые предметы */}
        {data.subjects.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Поддерживаемые предметы
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {data.subjects.map(subject => (
                <label key={subject.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newClassroom.supportedSubjects.includes(subject.id)}
                    onChange={() => toggleSupportedSubject(subject.id)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{subject.name}</span>
                </label>
              ))}
            </div>
            {newClassroom.supportedSubjects.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">
                  Выбрано: {newClassroom.supportedSubjects.length} предметов
                </span>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4">
          <button
            onClick={handleAddClassroom}
            disabled={!newClassroom.name.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить кабинет</span>
          </button>
        </div>
      </div>

      {/* Поиск */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Поиск кабинетов..."
          />
        </div>
      </div>

      {/* Панель массового управления */}
      {data.classrooms.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                Выбрано: {selectedClassrooms.length} из {filteredClassrooms.length}
              </span>
              <button
                onClick={handleSelectAllClassrooms}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {selectedClassrooms.length === filteredClassrooms.length ? 'Снять выделение' : 'Выбрать всех'}
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDelete}
                disabled={selectedClassrooms.length === 0}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Удалить выбранных
              </button>
              <button
                onClick={handleDeleteAllClassrooms}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить ВСЕ кабинеты
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список кабинетов */}
      {groupClassroomsByTens(filteredClassrooms).map(([groupName, classrooms]) => (
        <div key={groupName} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Building2 className="w-5 h-5 text-primary-600 mr-2" />
            Аудитории {groupName}
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
              {classrooms.length}
            </span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            {classrooms.map((classroom) => (
          <div 
            key={classroom.id} 
            className={`bg-white rounded border border-gray-200 p-2 transition-all duration-300 ${
              deletingClassroomId === classroom.id 
                ? 'animate-pulse bg-red-50 border-red-400 transform scale-95 opacity-50' 
                : 'hover:shadow-sm hover:scale-[1.01]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedClassrooms.includes(classroom.id)}
                  onChange={() => handleSelectClassroom(classroom.id)}
                  className="w-3 h-3 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div className="w-5 h-5 bg-primary-100 rounded flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-3 h-3 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  {editingClassroomId === classroom.id ? (
                    <input
                      type="text"
                      value={editClassroom.name}
                      onChange={(e) => setEditClassroom(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-primary-500 focus:outline-none text-xs"
                      placeholder="Название"
                    />
                  ) : (
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {classroom.name}
                    </h3>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-0.5">
                {editingClassroomId === classroom.id ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editClassroom.name.trim()}
                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditClassroom(classroom)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRemoveClassroom(classroom.id)}
                      disabled={deletingClassroomId === classroom.id}
                      className={`p-1 rounded transition-all duration-200 ${
                        deletingClassroomId === classroom.id
                          ? 'text-red-400 bg-red-100 cursor-not-allowed'
                          : 'text-red-600 hover:bg-red-50 hover:scale-110 active:scale-95'
                      }`}
                    >
                      <Trash2 className={`w-3 h-3 ${deletingClassroomId === classroom.id ? 'animate-spin' : ''}`} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {editingClassroomId === classroom.id ? (
              <div className="space-y-1">
                <select
                  value={editClassroom.type}
                  onChange={(e) => setEditClassroom(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Тип</option>
                  {CLASSROOM_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="number"
                    value={editClassroom.capacity}
                    onChange={(e) => setEditClassroom(prev => ({ ...prev, capacity: e.target.value }))}
                    className="px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Мест"
                  />
                  <input
                    type="text"
                    value={editClassroom.subject}
                    onChange={(e) => setEditClassroom(prev => ({ ...prev, subject: e.target.value }))}
                    className="px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Предмет"
                  />
                </div>
                
                <select
                  value={editClassroom.teacherId}
                  onChange={(e) => {
                    setEditClassroom(prev => ({ ...prev, teacherId: e.target.value }))
                    handleUpdateClassroomTeacher(editingClassroomId!, e.target.value)
                  }}
                  className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Закрепить учителя</option>
                  {data.teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.lastName} {teacher.firstName} {teacher.middleName || ''}
                    </option>
                  ))}
                </select>
                
                {/* Поддерживаемые предметы в режиме редактирования */}
                {data.subjects.length > 0 && (
                  <div className="mt-1">
                    <div className="text-xs text-gray-600 mb-1">Предметы:</div>
                    <div className="max-h-20 overflow-y-auto">
                      {data.subjects.map(subject => (
                        <label key={subject.id} className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editClassroom.supportedSubjects.includes(subject.id)}
                            onChange={() => toggleEditSupportedSubject(subject.id)}
                            className="w-3 h-3 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-xs text-gray-700">{subject.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-0.5">
                {classroom.type && (
                  <div className="text-xs text-gray-600 truncate">
                    {classroom.type}
                  </div>
                )}
                
                {classroom.capacity && (
                  <div className="text-xs text-gray-600">
                    {classroom.capacity} мест
                  </div>
                )}
                
                {classroom.subject && (
                  <div className="text-xs text-gray-600 truncate">
                    {classroom.subject}
                  </div>
                )}
                
                {classroom.teacherId && (
                  <div className="text-xs text-blue-600 truncate flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {getTeacherName(classroom.teacherId)}
                  </div>
                )}
                
                {classroom.supportedSubjects && classroom.supportedSubjects.length > 0 && (
                  <div className="text-xs text-green-600 truncate flex items-center">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {classroom.supportedSubjects.length} предметов
                  </div>
                )}
              </div>
            )}
          </div>
            ))}
          </div>
        </div>
      ))}

      {data.classrooms.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Кабинеты не добавлены
          </h3>
          <p className="text-gray-600">
            Добавьте первый кабинет для создания расписания
          </p>
        </div>
      )}

      {data.classrooms.length > 0 && filteredClassrooms.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Кабинеты не найдены
          </h3>
          <p className="text-gray-600">
            Попробуйте изменить поисковый запрос
          </p>
        </div>
      )}

      {/* Модальное окно для импорта кабинетов */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Импорт кабинетов из Excel
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
                  Найденные кабинеты ({importedClassrooms.length})
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Проверьте список кабинетов перед импортом. Каждому кабинету будут назначены стандартные параметры.
                </p>
              </div>
              
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                <div className="divide-y divide-gray-200">
                  {importedClassrooms.map((classroom, index) => (
                    <div key={index} className="p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">{classroom}</span>
                          <div className="text-xs text-gray-500 mt-1">
                            Тип: Обычный кабинет, Вместимость: 30, Поддерживаемые предметы: Не выбраны
                          </div>
                        </div>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {importedClassrooms.length === 0 && (
                <div className="text-center py-8">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Не найдено кабинетов для импорта</p>
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
                onClick={handleImportClassrooms}
                disabled={importedClassrooms.length === 0 || isImporting}
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
                    <span>Импортировать {importedClassrooms.length} кабинетов</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для массовых действий кабинетов */}
      {isBulkActionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Удаление кабинетов
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
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Trash2 className="w-5 h-5 text-red-500 mr-2" />
                    <h4 className="text-lg font-medium text-red-900">
                      Подтверждение удаления
                    </h4>
                  </div>
                  <p className="text-red-700 mt-2">
                    Вы собираетесь удалить {selectedClassrooms.length} кабинетов. Это действие нельзя отменить.
                  </p>
                </div>
                
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  <div className="divide-y divide-gray-200">
                    {selectedClassrooms.map(classroomId => {
                      const classroom = data.classrooms.find(c => c.id === classroomId)
                      if (!classroom) return null
                      return (
                        <div key={classroomId} className="p-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900">
                                {classroom.name}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                Тип: {classroom.type || 'Не указан'}, Вместимость: {classroom.capacity || 'Не указана'}
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
                disabled={isBulkProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isBulkProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Обработка...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Удалить {selectedClassrooms.length} кабинетов</span>
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
                Импорт кабинетов из Excel
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
                      <li>• <strong>Столбец A:</strong> Название кабинета (например: "101", "Актовый зал", "Спортзал")</li>
                      <li>• <strong>Столбец B:</strong> Пустой (не используется)</li>
                      <li>• <strong>Столбец C:</strong> Пустой (не используется)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-2">Пример заполнения:</p>
                    <div className="bg-white p-3 rounded border text-xs font-mono">
                      A1: 101<br/>
                      A2: 102<br/>
                      A3: Актовый зал<br/>
                      A4: Спортзал<br/>
                      A5: 201
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-yellow-800 text-xs">
                      💡 <strong>Важно:</strong> Для каждого кабинета будут установлены значения по умолчанию: тип "Обычный кабинет", вместимость 30, поддерживаемые предметы не выбраны
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
                  id="import-classrooms-file"
                />
                <label
                  htmlFor="import-classrooms-file"
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 cursor-pointer text-lg font-medium shadow-lg hover:shadow-xl"
                >
                  <Upload className="w-6 h-6" />
                  <span>Выбрать файл для загрузки</span>
                </label>
                <p className="text-sm text-gray-500 mt-3">
                  Нажмите для выбора Excel файла с данными кабинетов
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
