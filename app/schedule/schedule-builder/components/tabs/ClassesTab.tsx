'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Users, Trash2, Edit3, Search, X, Copy, Check, Minus, Settings, MoreVertical, BookOpen, Clock, Zap } from 'lucide-react'
import { useScheduleBuilder } from '../../context/ScheduleBuilderContext'

interface ClassesTabProps {
  onUpdateStatus?: (tabId: any, completed: boolean, hasErrors?: boolean) => void
}

const ClassesTab: React.FC<ClassesTabProps> = ({ onUpdateStatus }) => {
  const { data, updateClasses } = useScheduleBuilder()
  const [searchTerm, setSearchTerm] = useState('')
  const [newClassName, setNewClassName] = useState('')
  const [isAddingClass, setIsAddingClass] = useState(false)
  const [editingClass, setEditingClass] = useState<string | null>(null)
  const [editingClassName, setEditingClassName] = useState('')
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null)
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('')
  const [copyingFromClass, setCopyingFromClass] = useState<string | null>(null)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [templateCreated, setTemplateCreated] = useState(false)
  const [createdClassesCount, setCreatedClassesCount] = useState(0)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [newClassTeacher, setNewClassTeacher] = useState('')
  const [newClassIsElementary, setNewClassIsElementary] = useState(false)
  const [editingClassTeacher, setEditingClassTeacher] = useState('')
  const [editingClassIsElementary, setEditingClassIsElementary] = useState(false)
  const [editingSubjectGroups, setEditingSubjectGroups] = useState<{[key: string]: string[]}>({})

  const getFilteredClasses = () => {
    return data.classes.filter(classItem => 
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const getClassStats = (classItem: any) => {
    const subjectsCount = Object.keys(classItem.subjects).length
    const totalLoad = Object.values(classItem.subjects).reduce((sum: number, subjectData: any) => {
      const load = typeof subjectData === 'object' ? subjectData.load : subjectData
      return sum + (load || 0)
    }, 0)
    return { subjectsCount, totalLoad }
  }

  const getTeacherName = (teacherId: string) => {
    const teacher = data.teachers.find(t => t.id === teacherId)
    if (!teacher) return 'Неизвестный учитель'
    return `${teacher.lastName} ${teacher.firstName} ${teacher.middleName || ''}`.trim()
  }

  const getSubjectTeachers = (subjectId: string) => {
    return data.teachers.filter(teacher => teacher.subjects?.includes(subjectId))
  }

  const isElementaryClass = (className: string) => {
    const grade = parseInt(className.match(/^\d+/)?.[0] || '0')
    return grade >= 1 && grade <= 4
  }

  const handleAddGroupToSubject = (classId: string, subjectId: string, groupName: string) => {
    const updatedClasses = data.classes.map(c => {
      if (c.id === classId) {
        const newSubjects = { ...c.subjects }
        if (newSubjects[subjectId]) {
          const currentGroups = newSubjects[subjectId].groups || []
          if (!currentGroups.includes(groupName)) {
            newSubjects[subjectId] = {
              ...newSubjects[subjectId],
              groups: [...currentGroups, groupName]
            }
          }
        }
        return { ...c, subjects: newSubjects }
      }
      return c
    })
    updateClasses(updatedClasses)
  }

  const handleRemoveGroupFromSubject = (classId: string, subjectId: string, groupName: string) => {
    const updatedClasses = data.classes.map(c => {
      if (c.id === classId) {
        const newSubjects = { ...c.subjects }
        if (newSubjects[subjectId]) {
          const currentGroups = newSubjects[subjectId].groups || []
          newSubjects[subjectId] = {
            ...newSubjects[subjectId],
            groups: currentGroups.filter(g => g !== groupName)
          }
        }
        return { ...c, subjects: newSubjects }
      }
      return c
    })
    updateClasses(updatedClasses)
  }

  const handleSelectClass = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }

  const handleSelectAll = () => {
    const filteredClasses = getFilteredClasses()
    if (selectedClasses.length === filteredClasses.length) {
      setSelectedClasses([])
    } else {
      setSelectedClasses(filteredClasses.map(c => c.id))
    }
  }

  const handleBulkDelete = () => {
    const updatedClasses = data.classes.filter(c => !selectedClasses.includes(c.id))
    updateClasses(updatedClasses)
    setSelectedClasses([])
    setShowBulkActions(false)
  }

  const handleBulkCopy = (fromClassId: string) => {
    const fromClass = data.classes.find(c => c.id === fromClassId)
    if (!fromClass) return

    const updatedClasses = data.classes.map(classItem => {
      if (selectedClasses.includes(classItem.id) && classItem.id !== fromClassId) {
        return { ...classItem, subjects: { ...fromClass.subjects } }
      }
      return classItem
    })
    
    updateClasses(updatedClasses)
    setSelectedClasses([])
    setShowBulkActions(false)
  }

  const quickLoadPresets = [
    { name: 'Легкая', total: 20 },
    { name: 'Средняя', total: 30 },
    { name: 'Насыщенная', total: 40 }
  ]

  const handleQuickLoad = (classId: string, totalLoad: number) => {
    const classItem = data.classes.find(c => c.id === classId)
    if (!classItem) return

    const subjects = Object.keys(classItem.subjects)
    if (subjects.length === 0) return

    const loadPerSubject = Math.floor(totalLoad / subjects.length)
    const remainder = totalLoad % subjects.length

    const newSubjects = { ...classItem.subjects }
    subjects.forEach((subjectId, index) => {
      const currentSubjectData = classItem.subjects[subjectId]
      const isNewFormat = typeof currentSubjectData === 'object'
      
      if (isNewFormat) {
        newSubjects[subjectId] = {
          ...currentSubjectData,
          load: loadPerSubject + (index < remainder ? 1 : 0)
        }
      } else {
        // Миграция старого формата
        newSubjects[subjectId] = {
          load: loadPerSubject + (index < remainder ? 1 : 0),
          teacherId: undefined,
          groups: undefined
        }
      }
    })

    const updatedClasses = data.classes.map(c => 
      c.id === classId ? { ...c, subjects: newSubjects } : c
    )
    updateClasses(updatedClasses)
  }

  const handleCreateClassTemplate = () => {
    const templateClasses: Array<{ id: string; name: string; subjects: { [subjectId: string]: { load: number; teacherId?: string; groups?: string[] } }; classTeacher?: string; isElementary?: boolean }> = []
    
    // Классы 1-9 с буквами А, Б, В
    for (let grade = 1; grade <= 9; grade++) {
      ['А', 'Б', 'В'].forEach(letter => {
        const className = `${grade}${letter}`
        // Проверяем, не существует ли уже такой класс
        if (!data.classes.some(c => c.name === className)) {
          templateClasses.push({
            id: `class_${grade}_${letter}_${Date.now()}`,
            name: className,
            subjects: {},
            isElementary: grade >= 1 && grade <= 4
          })
        }
      })
    }
    
    // Классы 10-11 с буквами А, Б, В
    for (let grade = 10; grade <= 11; grade++) {
      ['А', 'Б', 'В'].forEach(letter => {
        const className = `${grade}${letter}`
        // Проверяем, не существует ли уже такой класс
        if (!data.classes.some(c => c.name === className)) {
          templateClasses.push({
            id: `class_${grade}_${letter}_${Date.now()}`,
            name: className,
            subjects: {},
            isElementary: false
          })
        }
      })
    }
    
    if (templateClasses.length > 0) {
      updateClasses([...data.classes, ...templateClasses])
      setCreatedClassesCount(templateClasses.length)
      setTemplateCreated(true)
      // Скрываем уведомление через 3 секунды
      setTimeout(() => setTemplateCreated(false), 3000)
    }
  }

  const handleDeleteAllClasses = () => {
    updateClasses([])
    setSelectedClasses([])
    setShowDeleteAllConfirm(false)
  }

  const handleAddClass = () => {
    if (!newClassName.trim()) return

    const newClass = {
      id: `class_${Date.now()}`,
      name: newClassName.trim(),
      subjects: {},
      classTeacher: newClassTeacher || undefined,
      isElementary: newClassIsElementary
    }
      
    updateClasses([...data.classes, newClass])
    setNewClassName('')
    setNewClassTeacher('')
    setNewClassIsElementary(false)
    setIsAddingClass(false)
  }

  const handleDeleteClass = async (classId: string) => {
    setDeletingClassId(classId)
    
    // Анимация удаления
    setTimeout(() => {
      const updatedClasses = data.classes.filter(c => c.id !== classId)
      updateClasses(updatedClasses)
      setDeletingClassId(null)
    }, 300)
  }

  const handleEditClass = (classId: string) => {
    const classItem = data.classes.find(c => c.id === classId)
    if (classItem) {
      setEditingClass(classId)
      setEditingClassName(classItem.name)
      setEditingClassTeacher(classItem.classTeacher || '')
      setEditingClassIsElementary(classItem.isElementary || false)
    }
  }

  const handleSaveEdit = () => {
    if (!editingClassName.trim() || !editingClass) return

    const updatedClasses = data.classes.map(classItem => {
      if (classItem.id === editingClass) {
        return { 
          ...classItem, 
          name: editingClassName.trim(),
          classTeacher: editingClassTeacher || undefined,
          isElementary: editingClassIsElementary
        }
      }
      return classItem
    })

    updateClasses(updatedClasses)
    setEditingClass(null)
    setEditingClassName('')
    setEditingClassTeacher('')
    setEditingClassIsElementary(false)
  }

  const handleCancelEdit = () => {
    setEditingClass(null)
    setEditingClassName('')
    setEditingClassTeacher('')
    setEditingClassIsElementary(false)
  }

  const handleAddSubjectToClass = (classId: string, subjectId: string) => {
    const updatedClasses = data.classes.map(classItem => {
      if (classItem.id === classId) {
        const newSubjects = { ...classItem.subjects }
        newSubjects[subjectId] = {
          load: 1, // По умолчанию 1 урок в неделю
          teacherId: undefined,
          groups: undefined
        }
        return { ...classItem, subjects: newSubjects }
      }
      return classItem
    })
    updateClasses(updatedClasses)
    setSubjectSearchTerm('') // Сбрасываем поиск после добавления
  }

  const handleRemoveSubjectFromClass = (classId: string, subjectId: string) => {
    const updatedClasses = data.classes.map(classItem => {
      if (classItem.id === classId) {
        const newSubjects = { ...classItem.subjects }
        delete newSubjects[subjectId]
        return { ...classItem, subjects: newSubjects }
      }
      return classItem
    })
    updateClasses(updatedClasses)
  }

  const handleUpdateSubjectLoad = (classId: string, subjectId: string, load: number) => {
    const updatedClasses = data.classes.map(classItem => {
      if (classItem.id === classId) {
        const newSubjects = { ...classItem.subjects }
        if (load > 0) {
          const currentSubjectData = classItem.subjects[subjectId]
          const isNewFormat = typeof currentSubjectData === 'object'
          
          if (isNewFormat) {
            newSubjects[subjectId] = {
              ...currentSubjectData,
              load: load
            }
          } else {
            // Миграция старого формата
            newSubjects[subjectId] = {
              load: load,
              teacherId: undefined,
              groups: undefined
            }
          }
        } else {
          delete newSubjects[subjectId]
        }
        return { ...classItem, subjects: newSubjects }
      }
      return classItem
    })
    updateClasses(updatedClasses)
  }

  const handleIncrementLoad = (classId: string, subjectId: string) => {
    const classItem = data.classes.find(c => c.id === classId)
    if (!classItem) return

    const currentSubjectData = classItem.subjects[subjectId]
    const currentLoad = typeof currentSubjectData === 'object' ? currentSubjectData.load : (currentSubjectData || 0)
    const newLoad = Math.min(currentLoad + 1, 20) // Максимум 20 уроков
    handleUpdateSubjectLoad(classId, subjectId, newLoad)
  }

  const handleDecrementLoad = (classId: string, subjectId: string) => {
    const classItem = data.classes.find(c => c.id === classId)
    if (!classItem) return

    const currentSubjectData = classItem.subjects[subjectId]
    const currentLoad = typeof currentSubjectData === 'object' ? currentSubjectData.load : (currentSubjectData || 0)
    const newLoad = Math.max(currentLoad - 1, 0) // Минимум 0 уроков
    handleUpdateSubjectLoad(classId, subjectId, newLoad)
  }

  const handleCopyClassSettings = (fromClassId: string, toClassId: string) => {
    const fromClass = data.classes.find(c => c.id === fromClassId)
    const toClass = data.classes.find(c => c.id === toClassId)
    
    if (!fromClass || !toClass) return

    const updatedClasses = data.classes.map(classItem => {
      if (classItem.id === toClassId) {
        return { ...classItem, subjects: { ...fromClass.subjects } }
      }
      return classItem
    })
    
    updateClasses(updatedClasses)
    setCopyingFromClass(null)
  }

  const getAvailableSubjects = (classId: string) => {
    const classItem = data.classes.find(c => c.id === classId)
    if (!classItem) return data.subjects

    return data.subjects
      .filter(subject => 
        !classItem.subjects[subject.id] && 
        subject.name.toLowerCase().includes(subjectSearchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }

  const getClassSubjects = (classId: string) => {
    const classItem = data.classes.find(c => c.id === classId)
    if (!classItem) return []

    return Object.entries(classItem.subjects)
      .map(([subjectId, subjectData]) => {
        const subject = data.subjects.find(s => s.id === subjectId)
        if (!subject) return null
        
        const isNewFormat = typeof subjectData === 'object'
        const load = isNewFormat ? subjectData.load : subjectData
        const teacherId = isNewFormat ? subjectData.teacherId : undefined
        const groups = isNewFormat ? subjectData.groups : undefined
        
        return { 
          ...subject, 
          load, 
          teacherId, 
          groups,
          subjectData: isNewFormat ? subjectData : { load, teacherId: undefined, groups: undefined }
        }
      })
      .filter(Boolean)
      .sort((a, b) => a!.name.localeCompare(b!.name, 'ru'))
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Классы и нагрузки</h2>
          <p className="text-gray-600">Управление классами и учебной нагрузкой</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск классов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
            />
          </div>

          {/* Переключатель вида */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Сетка
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Список
            </button>
          </div>

          {/* Кнопка "Выбрать все" */}
          {data.classes.length > 0 && getFilteredClasses().length > 0 && (
            <button
              onClick={handleSelectAll}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedClasses.length === getFilteredClasses().length
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
              }`}
            >
              {selectedClasses.length === getFilteredClasses().length ? 'Снять выделение' : 'Выбрать все'}
            </button>
          )}

          {/* Массовые действия */}
          {selectedClasses.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Выбрано: {selectedClasses.length}
              </span>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                Действия
              </button>
            </div>
          )}

          {/* Удалить все классы */}
          {data.classes.length > 0 && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              title="Удалить все классы"
            >
              <Trash2 className="w-4 h-4" />
              <span>Удалить все</span>
            </button>
          )}

          {/* Добавить класс */}
          <button
            onClick={() => setIsAddingClass(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить класс</span>
          </button>
        </div>
      </div>

      {/* Подтверждение удаления всех классов */}
      {showDeleteAllConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowDeleteAllConfirm(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Удалить все классы?</h3>
                <p className="text-sm text-gray-600">Это действие нельзя отменить</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Вы уверены, что хотите удалить все {data.classes.length} классов? 
              Все данные о нагрузке и предметах будут потеряны.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAllClasses}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Да, удалить все
              </button>
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Уведомление о создании шаблона */}
      {templateCreated && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-900">
              Шаблон классов успешно создан! Добавлено {createdClassesCount} классов (1А-9В и 10А-11В)
            </span>
            <button
              onClick={() => setTemplateCreated(false)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Массовые действия */}
      {showBulkActions && selectedClasses.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                Массовые действия для {selectedClasses.length} классов
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  Удалить
                </button>
                <select
                  onChange={(e) => e.target.value && handleBulkCopy(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  defaultValue=""
                >
                  <option value="">Копировать настройки из...</option>
                  {data.classes
                    .filter(c => !selectedClasses.includes(c.id))
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => setShowBulkActions(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Форма добавления класса */}
      {isAddingClass && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Создать новый класс</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Название класса (например: 5А, 6Б)"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newClassIsElementary}
                  onChange={(e) => setNewClassIsElementary(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Начальная школа (1-4 класс)</span>
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700 min-w-[120px]">Классный руководитель:</label>
              <select
                value={newClassTeacher}
                onChange={(e) => setNewClassTeacher(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Выберите учителя</option>
                {data.teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {getTeacherName(teacher.id)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleAddClass}
                disabled={!newClassName.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Создать
              </button>
              <button
                onClick={() => {
                  setIsAddingClass(false)
                  setNewClassName('')
                  setNewClassTeacher('')
                  setNewClassIsElementary(false)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список классов */}
      {data.classes.length > 0 && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {getFilteredClasses().map((classItem) => {
            const stats = getClassStats(classItem)
            const isSelected = selectedClasses.includes(classItem.id)
            
            return (
              <div 
                key={classItem.id} 
                className={`bg-white rounded-lg border transition-all duration-200 ${
                  deletingClassId === classItem.id 
                    ? 'animate-pulse bg-red-50 border-red-400 transform scale-95 opacity-50' 
                    : isSelected
                    ? 'border-primary-400 bg-primary-50 shadow-lg'
                    : 'border-gray-200 hover:shadow-md hover:border-gray-300'
                } ${viewMode === 'list' ? 'p-4' : 'p-4'}`}
              >
                {/* Заголовок класса */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectClass(classItem.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      {editingClass === classItem.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingClassName}
                              onChange={(e) => setEditingClassName(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm font-semibold"
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                              autoFocus
                            />
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="flex items-center space-x-1">
                              <input
                                type="checkbox"
                                checked={editingClassIsElementary}
                                onChange={(e) => setEditingClassIsElementary(e.target.checked)}
                                className="w-3 h-3 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <span className="text-xs text-gray-600">Начальная школа</span>
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-600 min-w-[80px]">Классный руководитель:</label>
                            <select
                              value={editingClassTeacher}
                              onChange={(e) => setEditingClassTeacher(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                            >
                              <option value="">Выберите учителя</option>
                              {data.teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                  {getTeacherName(teacher.id)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {classItem.name}
                          </h3>
                          {(classItem.classTeacher || classItem.isElementary) && (
                            <div className="mt-1 space-y-1">
                              {classItem.isElementary && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Начальная школа
                                </span>
                              )}
                              {classItem.classTeacher && (
                                <div className="text-xs text-gray-600">
                                  Классный руководитель: {getTeacherName(classItem.classTeacher)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditClass(classItem.id)}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      title="Редактировать название"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(classItem.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Удалить класс"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Статистика */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{stats.subjectsCount} предметов</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{stats.totalLoad} уроков/нед</span>
                    </div>
                  </div>
                  
                  {/* Быстрые пресеты нагрузки */}
                  {stats.subjectsCount > 0 && (
                    <div className="flex space-x-1">
                      {quickLoadPresets.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => handleQuickLoad(classItem.id, preset.total)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-primary-100 hover:text-primary-700 transition-colors"
                          title={`Установить ${preset.name} нагрузку (${preset.total} уроков)`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              
                {/* Добавление предмета */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Добавить предмет:</h4>
                    {copyingFromClass && copyingFromClass !== classItem.id && (
                      <button
                        onClick={() => handleCopyClassSettings(copyingFromClass, classItem.id)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Копировать</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Поиск предметов..."
                      value={subjectSearchTerm}
                      onChange={(e) => setSubjectSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                    {getAvailableSubjects(classItem.id).map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => handleAddSubjectToClass(classItem.id, subject.id)}
                        className="px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-primary-100 hover:text-primary-700 transition-colors flex items-center space-x-1 text-left"
                      >
                        <Plus className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{subject.name}</span>
                      </button>
                    ))}
                    {getAvailableSubjects(classItem.id).length === 0 && subjectSearchTerm && (
                      <div className="col-span-2 text-center">
                        <p className="text-xs text-gray-500">Предметы не найдены</p>
                      </div>
                    )}
                    {getAvailableSubjects(classItem.id).length === 0 && !subjectSearchTerm && (
                      <div className="col-span-2 text-center">
                        <p className="text-xs text-gray-500">Все предметы уже добавлены</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Список предметов с нагрузкой */}
                {getClassSubjects(classItem.id).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Учебная нагрузка:</h4>
                    <div className="space-y-2">
                      {getClassSubjects(classItem.id).map((subject: any) => (
                        <div key={subject.id} className="p-2 bg-gray-50 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{subject.name}</span>
                              {subject.difficulty && (
                                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                                  subject.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                  subject.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {subject.difficulty === 'easy' ? 'Л' :
                                   subject.difficulty === 'medium' ? 'С' : 'Т'}
                                </span>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handleRemoveSubjectFromClass(classItem.id, subject.id)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                              title="Удалить предмет"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleDecrementLoad(classItem.id, subject.id)}
                                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition-colors"
                                title="Уменьшить"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                value={subject.load}
                                onChange={(e) => handleUpdateSubjectLoad(classItem.id, subject.id, parseInt(e.target.value) || 0)}
                                className="w-12 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-center"
                                min="0"
                                max="20"
                              />
                              <button
                                onClick={() => handleIncrementLoad(classItem.id, subject.id)}
                                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition-colors"
                                title="Увеличить"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <span className="text-xs text-gray-500 ml-1">ур</span>
                            </div>
                            
                            {/* Селект учителя для 5+ классов */}
                            {!classItem.isElementary && (
                              <div className="flex items-center space-x-2">
                                <label className="text-xs text-gray-600">Учитель:</label>
                                <select
                                  value={subject.teacherId || ''}
                                  onChange={(e) => {
                                    const updatedClasses = data.classes.map(c => {
                                      if (c.id === classItem.id) {
                                        const newSubjects = { ...c.subjects }
                                        if (newSubjects[subject.id]) {
                                          newSubjects[subject.id] = {
                                            ...newSubjects[subject.id],
                                            teacherId: e.target.value || undefined
                                          }
                                        }
                                        return { ...c, subjects: newSubjects }
                                      }
                                      return c
                                    })
                                    updateClasses(updatedClasses)
                                  }}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  <option value="">Выберите учителя</option>
                                  {getSubjectTeachers(subject.id).map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>
                                      {getTeacherName(teacher.id)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            
                            {/* Для начальных классов показываем классного руководителя */}
                            {classItem.isElementary && classItem.classTeacher && (
                              <div className="text-xs text-gray-600">
                                Учитель: {getTeacherName(classItem.classTeacher)}
                              </div>
                            )}
                          </div>
                          
                          {/* Группы предмета */}
                          {subject.groups && subject.groups.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600">Группы:</span>
                              <div className="flex flex-wrap gap-1">
                                {subject.groups.map((group: string) => (
                                  <span
                                    key={group}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                  >
                                    {group}
                                    <button
                                      onClick={() => handleRemoveGroupFromSubject(classItem.id, subject.id, group)}
                                      className="ml-1 text-purple-600 hover:text-purple-800"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Добавить группу */}
                          {!classItem.isElementary && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                placeholder="Добавить группу (например: 1, 2, А, Б)"
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    handleAddGroupToSubject(classItem.id, subject.id, e.currentTarget.value.trim())
                                    e.currentTarget.value = ''
                                  }
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  const input = e.currentTarget.previousElementSibling as HTMLInputElement
                                  if (input.value.trim()) {
                                    handleAddGroupToSubject(classItem.id, subject.id, input.value.trim())
                                    input.value = ''
                                  }
                                }}
                                className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                              >
                                Добавить
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {getClassSubjects(classItem.id).length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Нет предметов</p>
                    <p className="text-xs">Добавьте предметы выше</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}


      {/* Пустое состояние */}
      {data.classes.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Нет классов
          </h3>
          <p className="text-gray-600 mb-6">
            Создайте классы для назначения учебной нагрузки
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleCreateClassTemplate}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Zap className="w-5 h-5" />
              <span>Создать шаблон классов</span>
            </button>
            <button
              onClick={() => setIsAddingClass(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Создать класс</span>
            </button>
          </div>
        </div>
      )}

      {/* Отфильтрованные результаты */}
      {data.classes.length > 0 && getFilteredClasses().length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Классы не найдены
          </h4>
          <p className="text-gray-600">
            Попробуйте изменить поисковый запрос
          </p>
        </div>
      )}
    </div>
  )
}

export default ClassesTab