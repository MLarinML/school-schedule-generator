'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, BookOpen, Users, AlertCircle, Search, Upload, FileSpreadsheet, Edit, X } from 'lucide-react'
import { useScheduleBuilder, Subject } from '../../context/ScheduleBuilderContext'
import { TabType } from '../../page'
import * as XLSX from 'xlsx'

interface SubjectsTabProps {
  onUpdateStatus: (tabId: TabType, completed: boolean, hasErrors?: boolean) => void
}

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Легкий', color: 'text-green-600 bg-green-100', description: 'Базовые предметы' },
  { value: 'medium', label: 'Средний', color: 'text-yellow-600 bg-yellow-100', description: 'Средней сложности' },
  { value: 'hard', label: 'Сложный', color: 'text-red-600 bg-red-100', description: 'Сложные предметы' }
]

export const SubjectsTab = ({ onUpdateStatus }: SubjectsTabProps) => {
  const { data, addSubject, removeSubject, updateSubjects, updateSubject } = useScheduleBuilder()
  const [newSubject, setNewSubject] = useState({
    name: '',
    difficulty: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importedSubjects, setImportedSubjects] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<'delete' | 'assign_difficulty' | null>(null)
  const [bulkDifficulty, setBulkDifficulty] = useState<string>('medium')
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  
  // Состояние для показа инструкции импорта
  const [showImportInstructions, setShowImportInstructions] = useState(false)
  
  // Состояния для редактирования предметов
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [editingSubjectName, setEditingSubjectName] = useState('')
  const [editingSubjectDifficulty, setEditingSubjectDifficulty] = useState('')

  useEffect(() => {
    const hasSubjects = data.subjects.length > 0
    const hasErrors = data.subjects.some(subject => !subject.name.trim())
    
    onUpdateStatus('subjects', hasSubjects && !hasErrors, hasErrors)
  }, [data.subjects]) // убираем onUpdateStatus из зависимостей

  // Фильтрация и сортировка предметов
  const filteredSubjects = data.subjects
    .filter(subject => {
      const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDifficulty = !selectedDifficulty || subject.difficulty === selectedDifficulty
      return matchesSearch && matchesDifficulty
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  const handleAddSubject = () => {
    if (newSubject.name.trim()) {
      const subject: Subject = {
        id: Date.now().toString(),
        name: newSubject.name.trim(),
        difficulty: newSubject.difficulty as 'easy' | 'medium' | 'hard' || undefined,
        isGrouped: false
      }
      
      addSubject(subject)
      setNewSubject({ name: '', difficulty: '' })
    }
  }

  const handleRemoveSubject = (id: string) => {
    setDeletingSubjectId(id)
    
    // Анимация удаления
    setTimeout(() => {
      removeSubject(id)
      setDeletingSubjectId(null)
    }, 300) // Длительность анимации
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
        
        // Извлекаем названия предметов из первого столбца
        const subjects = jsonData
          .map((row: any) => row[0]) // Берем первый столбец
          .filter((name: any) => name && typeof name === 'string' && name.trim()) // Фильтруем пустые и нестроковые значения
          .map((name: string) => name.trim()) // Убираем лишние пробелы
        
        setImportedSubjects(subjects)
        setIsImportModalOpen(true)
      } catch (error) {
        console.error('Ошибка при чтении файла:', error)
        alert('Ошибка при чтении Excel файла. Проверьте формат файла.')
      }
    }
    
    reader.readAsBinaryString(file)
  }

  const handleImportSubjects = () => {
    if (importedSubjects.length === 0) return

    setIsImporting(true)
    
    // Имитируем задержку для UX
    setTimeout(() => {
      const newSubjects: Subject[] = importedSubjects.map((name, index) => {
        return {
          id: `imported-${Date.now()}-${index}`,
          name: name,
          difficulty: 'medium',
          isGrouped: false
        }
      })
      
      // Добавляем предметы
      newSubjects.forEach(subject => {
        addSubject(subject)
      })
      
      setImportedSubjects([])
      setIsImportModalOpen(false)
      setIsImporting(false)
      
      alert(`Успешно импортировано ${newSubjects.length} предметов!`)
    }, 1000)
  }

  const handleCloseImportModal = () => {
    setImportedSubjects([])
    setIsImportModalOpen(false)
  }

  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  const handleSelectAllSubjects = () => {
    const filteredSubjects = data.subjects.filter(subject => {
      const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDifficulty = !selectedDifficulty || subject.difficulty === selectedDifficulty
      return matchesSearch && matchesDifficulty
    })
    if (selectedSubjects.length === filteredSubjects.length) {
      setSelectedSubjects([])
    } else {
      setSelectedSubjects(filteredSubjects.map(s => s.id))
    }
  }

  const handleBulkDelete = () => {
    setBulkAction('delete')
    setIsBulkActionModalOpen(true)
  }

  const handleBulkAssignDifficulty = () => {
    setBulkAction('assign_difficulty')
    setBulkDifficulty('medium')
    setIsBulkActionModalOpen(true)
  }

  const handleDeleteAllSubjects = () => {
    if (confirm('Вы уверены, что хотите удалить ВСЕ предметы? Это действие нельзя отменить.')) {
      data.subjects.forEach(subject => {
        removeSubject(subject.id)
      })
      setSelectedSubjects([])
    }
  }

  const handleExecuteBulkAction = async () => {
    if (!bulkAction || selectedSubjects.length === 0) return

    setIsBulkProcessing(true)

    // Имитируем задержку для UX
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (bulkAction === 'delete') {
      selectedSubjects.forEach(subjectId => {
        removeSubject(subjectId)
      })
      setSelectedSubjects([])
    } else if (bulkAction === 'assign_difficulty') {
      selectedSubjects.forEach(subjectId => {
        const subject = data.subjects.find(s => s.id === subjectId)
        if (subject) {
          const updatedSubject = {
            ...subject,
            difficulty: bulkDifficulty as 'easy' | 'medium' | 'hard' | undefined
          }
          updateSubject(updatedSubject)
        }
      })
    }

    setIsBulkProcessing(false)
    setIsBulkActionModalOpen(false)
    setBulkAction(null)
    setBulkDifficulty('medium')
    setSelectedSubjects([])

    const actionText = bulkAction === 'delete' ? 'удалены' : 'обновлены'
    alert(`Успешно ${actionText} ${selectedSubjects.length} предметов!`)
  }

  const handleCloseBulkActionModal = () => {
    setIsBulkActionModalOpen(false)
    setBulkAction(null)
    setBulkDifficulty('medium')
  }

  // Функции для редактирования предметов
  const handleEditSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id)
    setEditingSubjectName(subject.name)
    setEditingSubjectDifficulty(subject.difficulty || 'medium')
  }

  const handleSaveEdit = () => {
    if (!editingSubjectId || !editingSubjectName.trim()) return

    const updatedSubjects = data.subjects.map(subject => 
      subject.id === editingSubjectId 
        ? { ...subject, name: editingSubjectName.trim(), difficulty: editingSubjectDifficulty as 'easy' | 'medium' | 'hard' }
        : subject
    )
    
    updateSubjects(updatedSubjects)
    setEditingSubjectId(null)
    setEditingSubjectName('')
    setEditingSubjectDifficulty('')
  }

  const handleCancelEdit = () => {
    setEditingSubjectId(null)
    setEditingSubjectName('')
    setEditingSubjectDifficulty('')
  }

  // Функция для разделения предмета на группы
  const handleSplitSubject = (subject: Subject) => {
    const baseName = subject.name.replace(/\s+\d+$/, '') // Убираем цифру в конце, если есть
    
    // Проверяем, есть ли уже группы для этого предмета
    const existingGroups = data.subjects.filter(s => {
      const match = s.name.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)$`))
      return match !== null
    })
    
    // Если уже есть группы, не создаем новые
    if (existingGroups.length > 0) {
      return
    }
    
    // Создаем два новых предмета (группы 1 и 2)
    const subject1: Subject = {
      id: `subject_${Date.now()}_1`,
      name: `${baseName} 1`,
      difficulty: subject.difficulty || 'medium',
      isGrouped: true
    }
    
    const subject2: Subject = {
      id: `subject_${Date.now()}_2`,
      name: `${baseName} 2`,
      difficulty: subject.difficulty || 'medium',
      isGrouped: true
    }
    
    // Удаляем оригинальный предмет и добавляем два новых
    const updatedSubjects = data.subjects
      .filter(s => s.id !== subject.id) // Удаляем оригинальный предмет
      .concat([subject1, subject2]) // Добавляем два новых предмета
    
    updateSubjects(updatedSubjects)
  }

  // Функция для проверки, можно ли разделить предмет
  const canSplitSubject = (subject: Subject) => {
    const baseName = subject.name.replace(/\s+\d+$/, '') // Убираем цифру в конце, если есть
    
    // Проверяем, есть ли уже группы для этого предмета
    const existingGroups = data.subjects.filter(s => {
      const match = s.name.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)$`))
      return match !== null
    })
    
    // Можно разделить только если нет существующих групп
    return existingGroups.length === 0
  }

  const getDifficultyInfo = (difficulty: string) => {
    return DIFFICULTY_LEVELS.find(d => d.value === difficulty) || DIFFICULTY_LEVELS[1]
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Управление предметами
        </h2>
        <p className="text-gray-600">
          Добавьте учебные предметы и настройте их параметры для корректного распределения в расписании
        </p>
      </div>

      {/* Добавление нового предмета */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Добавить предмет
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название предмета *
            </label>
            <input
              type="text"
              value={newSubject.name}
              onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Например: Математика, Физика, Литература"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Сложность
            </label>
            <select
              value={newSubject.difficulty}
              onChange={(e) => setNewSubject(prev => ({ ...prev, difficulty: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Выберите сложность</option>
              {DIFFICULTY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleAddSubject}
            disabled={!newSubject.name.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить предмет</span>
          </button>
        </div>
      </div>

      {/* Поиск и фильтры */}
      {data.subjects.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Поиск и фильтры
          </h3>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Поиск по названию предмета..."
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDifficulty('')}
                className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                  !selectedDifficulty
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Все сложности
              </button>
              {DIFFICULTY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setSelectedDifficulty(level.value)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                    selectedDifficulty === level.value
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
            
            {(searchQuery || selectedDifficulty) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedDifficulty('')
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Очистить фильтры
              </button>
            )}
          </div>
        </div>
      )}

      {/* Панель массового управления */}
      {data.subjects.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                Выбрано: {selectedSubjects.length} из {filteredSubjects.length}
              </span>
              <button
                onClick={handleSelectAllSubjects}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {selectedSubjects.length === filteredSubjects.length ? 'Снять выделение' : 'Выбрать всех'}
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDelete}
                disabled={selectedSubjects.length === 0}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Удалить выбранных
              </button>
              <button
                onClick={handleBulkAssignDifficulty}
                disabled={selectedSubjects.length === 0}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Назначить сложность
              </button>
              <button
                onClick={handleDeleteAllSubjects}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить ВСЕ предметы
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список предметов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((subject) => {
          const difficultyInfo = getDifficultyInfo(subject.difficulty || 'medium')
          
          return (
            <div 
              key={subject.id} 
              className={`bg-white rounded-lg border border-gray-200 p-6 transition-all duration-300 ${
                deletingSubjectId === subject.id 
                  ? 'animate-pulse bg-red-50 border-red-400 transform scale-95 opacity-50' 
                  : 'hover:shadow-md hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => handleSelectSubject(subject.id)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    {editingSubjectId === subject.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingSubjectName}
                          onChange={(e) => setEditingSubjectName(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                          autoFocus
                        />
                        <select
                          value={editingSubjectDifficulty}
                          onChange={(e) => setEditingSubjectDifficulty(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          {DIFFICULTY_LEVELS.map(level => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex space-x-1">
                          <button
                            onClick={handleSaveEdit}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {subject.name}
                        </h3>
                        {subject.difficulty && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${difficultyInfo.color}`}>
                            {difficultyInfo.label}
                          </span>
                        )}
                        {subject.isGrouped && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 ml-2">
                            Группа
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  {editingSubjectId !== subject.id && (
                    <>
                      <button
                        onClick={() => handleEditSubject(subject)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                        title="Редактировать предмет"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSplitSubject(subject)}
                        disabled={!canSplitSubject(subject)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          canSplitSubject(subject)
                            ? 'text-purple-600 hover:bg-purple-50 hover:scale-110 active:scale-95 cursor-pointer'
                            : 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-50'
                        }`}
                        title={canSplitSubject(subject) ? "Разделить на группы" : "Уже разделен на группы"}
                      >
                        <Users className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleRemoveSubject(subject.id)}
                    disabled={deletingSubjectId === subject.id}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      deletingSubjectId === subject.id
                        ? 'text-red-400 bg-red-100 cursor-not-allowed'
                        : 'text-red-600 hover:bg-red-50 hover:scale-110 active:scale-95'
                    }`}
                    title="Удалить предмет"
                  >
                    <Trash2 className={`w-4 h-4 ${deletingSubjectId === subject.id ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                {!subject.difficulty && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <AlertCircle className="w-4 h-4" />
                    <span>Сложность не указана</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {data.subjects.length > 0 && filteredSubjects.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Предметы не найдены
          </h3>
          <p className="text-gray-600">
            Попробуйте изменить фильтры поиска
          </p>
        </div>
      )}

      {data.subjects.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Предметы не добавлены
          </h3>
          <p className="text-gray-600">
            Добавьте первый предмет для создания расписания
          </p>
        </div>
      )}

      {/* Подсказки */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Подсказки по настройке предметов:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Сложность</strong> — влияет на распределение предметов в расписании</li>
          <li>• Все предметы должны иметь уникальные названия</li>
        </ul>
      </div>

      {/* Модальное окно для импорта предметов */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Импорт предметов из Excel
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
                  Найденные предметы ({importedSubjects.length})
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Проверьте список предметов перед импортом. Каждому предмету будут назначены стандартные параметры.
                </p>
              </div>
              
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                <div className="divide-y divide-gray-200">
                  {importedSubjects.map((subject, index) => (
                    <div key={index} className="p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">{subject}</span>
                          <div className="text-xs text-gray-500 mt-1">
                            Сложность: Средняя, Групповое деление: Нет
                          </div>
                        </div>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {importedSubjects.length === 0 && (
                <div className="text-center py-8">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Не найдено предметов для импорта</p>
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
                onClick={handleImportSubjects}
                disabled={importedSubjects.length === 0 || isImporting}
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
                    <span>Импортировать {importedSubjects.length} предметов</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для массовых действий предметов */}
      {isBulkActionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {bulkAction === 'delete' ? 'Удаление предметов' : 'Назначение сложности'}
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
                      Вы собираетесь удалить {selectedSubjects.length} предметов. Это действие нельзя отменить.
                    </p>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    <div className="divide-y divide-gray-200">
                      {selectedSubjects.map(subjectId => {
                        const subject = data.subjects.find(s => s.id === subjectId)
                        if (!subject) return null
                        const difficultyInfo = getDifficultyInfo(subject.difficulty || 'medium')
                        return (
                          <div key={subjectId} className="p-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-gray-900">
                                  {subject.name}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  Сложность: {difficultyInfo.label}, Групповое деление: {subject.isGrouped ? 'Да' : 'Нет'}
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
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Plus className="w-5 h-5 text-green-500 mr-2" />
                      <h4 className="text-lg font-medium text-green-900">
                        Назначение сложности
                      </h4>
                    </div>
                    <p className="text-green-700 mt-2">
                      Выберите уровень сложности для {selectedSubjects.length} предметов.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Уровень сложности
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {DIFFICULTY_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => setBulkDifficulty(level.value)}
                          className={`p-3 border rounded-lg text-left transition-colors duration-200 ${
                            bulkDifficulty === level.value
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{level.description}</div>
                        </button>
                      ))}
                    </div>
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
                disabled={isBulkProcessing || (bulkAction === 'assign_difficulty' && !bulkDifficulty)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  bulkAction === 'delete'
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300'
                    : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300'
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
                        <span>Удалить {selectedSubjects.length} предметов</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Назначить сложность {selectedSubjects.length} предметам</span>
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
                Импорт предметов из Excel
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
                      <li>• <strong>Столбец A:</strong> Название предмета (например: "Математика", "Русский язык", "Физика")</li>
                      <li>• <strong>Столбец B:</strong> Пустой (не используется)</li>
                      <li>• <strong>Столбец C:</strong> Пустой (не используется)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-2">Пример заполнения:</p>
                    <div className="bg-white p-3 rounded border text-xs font-mono">
                      A1: Математика<br/>
                      A2: Русский язык<br/>
                      A3: Физика<br/>
                      A4: Химия<br/>
                      A5: История
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-yellow-800 text-xs">
                      💡 <strong>Важно:</strong> Для каждого предмета будут установлены значения по умолчанию: сложность "Средний", групповой "Нет"
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
                  id="import-subjects-file"
                />
                <label
                  htmlFor="import-subjects-file"
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 cursor-pointer text-lg font-medium shadow-lg hover:shadow-xl"
                >
                  <Upload className="w-6 h-6" />
                  <span>Выбрать файл для загрузки</span>
                </label>
                <p className="text-sm text-gray-500 mt-3">
                  Нажмите для выбора Excel файла с данными предметов
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
