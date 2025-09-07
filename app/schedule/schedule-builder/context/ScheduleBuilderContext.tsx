'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '../../../../contexts/AuthContext'

export interface Teacher {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  subjects: string[] // массив ID предметов, которые преподает учитель
  classroomId?: string // ID кабинета, закрепленного за учителем
  blockers: {
    [day: string]: {
      fullDay: boolean
      lessons: number[]
    }
  }
}

export interface Classroom {
  id: string
  name: string
  type?: string
  capacity?: number
  subject?: string
  teacherId?: string // ID учителя, закрепленного за кабинетом
  supportedSubjects?: string[] // массив ID предметов, которые поддерживает кабинет
}

export interface Subject {
  id: string
  name: string
  difficulty?: 'easy' | 'medium' | 'hard'
  isGrouped: boolean
}

export interface Class {
  id: string
  name: string
  classTeacher?: string // ID классного руководителя
  isElementary?: boolean // флаг для 1-4 классов
  subjects: {
    [subjectId: string]: {
      load: number // количество уроков в неделю
      teacherId?: string // ID учителя (для 5+ классов)
      groups?: string[] // группы предмета (например, ["1", "2"])
    }
  }
}

export interface ScheduleBuilderData {
  teachers: Teacher[]
  classrooms: Classroom[]
  subjects: Subject[]
  classes: Class[]
}

export interface GenerationResult {
  success: boolean
  conflicts: Array<{
    type: 'teacher' | 'classroom' | 'load'
    message: string
    severity: 'error' | 'warning'
  }>
  studentSchedule: Array<{
    day: string
    className: string
    lessonNumber: number
    subjectName: string
    classroomName: string
  }>
  teacherSchedule: Array<{
    teacherName: string
    day: string
    lessonNumber: number
    subjectName: string
    className: string
  }>
}

interface ScheduleBuilderContextType {
  data: ScheduleBuilderData
  generationResult: GenerationResult | null
  updateTeachers: (teachers: Teacher[]) => void
  updateTeacher: (teacher: Teacher) => void
  updateTeacherClassroom: (teacherId: string, classroomId: string | undefined) => void
  updateClassrooms: (classrooms: Classroom[]) => void
  updateSubjects: (subjects: Subject[]) => void
  updateSubject: (subject: Subject) => void
  updateClasses: (classes: Class[]) => void
  addTeacher: (teacher: Teacher) => void
  removeTeacher: (id: string) => void
  addClassroom: (classroom: Classroom) => void
  removeClassroom: (id: string) => void
  addSubject: (subject: Subject) => void
  removeSubject: (id: string) => void
  addClass: (classItem: Class) => void
  removeClass: (id: string) => void
  setGenerationResult: (result: GenerationResult | null) => void
  resetData: () => void
}

const initialData: ScheduleBuilderData = {
  teachers: [],
  classrooms: [],
  subjects: [],
  classes: []
}

const ScheduleBuilderContext = createContext<ScheduleBuilderContextType | undefined>(undefined)

export const ScheduleBuilderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  
  const [data, setData] = useState<ScheduleBuilderData>(() => {
    if (typeof window !== 'undefined' && user) {
      const userKey = `schedule-builder-data-${user.id}`
      const saved = localStorage.getItem(userKey)
      if (saved) {
        const parsedData = JSON.parse(saved)
        // Миграция: добавляем поле subjects и classroomId для существующих учителей
        const migratedTeachers = parsedData.teachers?.map((teacher: any) => ({
          ...teacher,
          subjects: teacher.subjects || [],
          classroomId: teacher.classroomId || undefined
        })) || []
        
        // Миграция: добавляем поле supportedSubjects для существующих кабинетов
        const migratedClassrooms = parsedData.classrooms?.map((classroom: any) => ({
          ...classroom,
          supportedSubjects: classroom.supportedSubjects || []
        })) || []
        
        // Миграция: обновляем структуру классов для поддержки новой схемы
        const migratedClasses = parsedData.classes?.map((classItem: any) => {
          const newSubjects: { [key: string]: { load: number; teacherId?: string; groups?: string[] } } = {}
          
          // Если subjects уже в новом формате, оставляем как есть
          if (classItem.subjects && typeof Object.values(classItem.subjects)[0] === 'object') {
            return classItem
          }
          
          // Если subjects в старом формате (числа), конвертируем в новый
          if (classItem.subjects) {
            Object.entries(classItem.subjects).forEach(([subjectId, load]) => {
              newSubjects[subjectId] = {
                load: typeof load === 'number' ? load : 0,
                teacherId: undefined,
                groups: undefined
              }
            })
          }
          
          return {
            ...classItem,
            subjects: newSubjects,
            classTeacher: classItem.classTeacher || undefined,
            isElementary: classItem.isElementary || false
          }
        }) || []
        
        return {
          ...parsedData,
          teachers: migratedTeachers,
          classrooms: migratedClassrooms,
          classes: migratedClasses
        }
      }
      return initialData
    }
    return initialData
  })

  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(() => {
    if (typeof window !== 'undefined' && user) {
      const userKey = `schedule-builder-generation-${user.id}`
      const saved = localStorage.getItem(userKey)
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return null
  })

  // Сохраняем данные в localStorage при изменении (только для авторизованных пользователей)
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const userKey = `schedule-builder-data-${user.id}`
      localStorage.setItem(userKey, JSON.stringify(data))
    }
  }, [data, user])

  // Сохраняем результат генерации в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const userKey = `schedule-builder-generation-${user.id}`
      if (generationResult) {
        localStorage.setItem(userKey, JSON.stringify(generationResult))
      } else {
        localStorage.removeItem(userKey)
      }
    }
  }, [generationResult, user])

  // Загружаем данные пользователя при смене пользователя
  useEffect(() => {
    if (user) {
      const userKey = `schedule-builder-data-${user.id}`
      const saved = localStorage.getItem(userKey)
      if (saved) {
        setData(JSON.parse(saved))
      } else {
        setData(initialData)
      }
    } else {
      // Если пользователь не авторизован, очищаем данные
      setData(initialData)
    }
  }, [user])

  const updateTeachers = (teachers: Teacher[]) => {
    setData(prev => ({ ...prev, teachers }))
    setGenerationResult(null) // Сбрасываем результат генерации при изменении данных
  }

  const updateTeacher = (teacher: Teacher) => {
    setData(prev => ({
      ...prev,
      teachers: prev.teachers.map(t => t.id === teacher.id ? teacher : t)
    }))
    setGenerationResult(null) // Сбрасываем результат генерации при изменении данных
  }

  const updateTeacherClassroom = (teacherId: string, classroomId: string | undefined) => {
    setData(prev => {
      // Обновляем учителя
      const updatedTeachers = prev.teachers.map(t => 
        t.id === teacherId ? { ...t, classroomId } : t
      )
      
      // Обновляем кабинеты (убираем закрепление у других учителей, если кабинет уже закреплен)
      let updatedClassrooms = prev.classrooms
      if (classroomId) {
        // Убираем закрепление у других учителей для этого кабинета
        updatedTeachers.forEach(teacher => {
          if (teacher.id !== teacherId && teacher.classroomId === classroomId) {
            teacher.classroomId = undefined
          }
        })
        
        // Устанавливаем закрепление для выбранного учителя
        updatedClassrooms = prev.classrooms.map(c => 
          c.id === classroomId ? { ...c, teacherId } : c
        )
      } else {
        // Убираем закрепление кабинета
        const teacher = prev.teachers.find(t => t.id === teacherId)
        if (teacher?.classroomId) {
          updatedClassrooms = prev.classrooms.map(c => 
            c.id === teacher.classroomId ? { ...c, teacherId: undefined } : c
          )
        }
      }
      
      return {
        ...prev,
        teachers: updatedTeachers,
        classrooms: updatedClassrooms
      }
    })
    setGenerationResult(null)
  }

  const updateClassrooms = (classrooms: Classroom[]) => {
    setData(prev => ({ ...prev, classrooms }))
    setGenerationResult(null)
  }

  const updateSubjects = (subjects: Subject[]) => {
    setData(prev => ({ ...prev, subjects }))
    setGenerationResult(null)
  }

  const updateSubject = (subject: Subject) => {
    setData(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => s.id === subject.id ? subject : s)
    }))
    setGenerationResult(null)
  }

  const updateClasses = (classes: Class[]) => {
    setData(prev => ({ ...prev, classes }))
    setGenerationResult(null)
  }

  const addTeacher = (teacher: Teacher) => {
    setData(prev => ({ ...prev, teachers: [...prev.teachers, teacher] }))
    setGenerationResult(null)
  }

  const removeTeacher = (id: string) => {
    setData(prev => ({ ...prev, teachers: prev.teachers.filter(t => t.id !== id) }))
    setGenerationResult(null)
  }

  const addClassroom = (classroom: Classroom) => {
    setData(prev => ({ ...prev, classrooms: [...prev.classrooms, classroom] }))
    setGenerationResult(null)
  }

  const removeClassroom = (id: string) => {
    setData(prev => ({ ...prev, classrooms: prev.classrooms.filter(c => c.id !== id) }))
    setGenerationResult(null)
  }

  const addSubject = (subject: Subject) => {
    setData(prev => ({ ...prev, subjects: [...prev.subjects, subject] }))
    setGenerationResult(null)
  }

  const removeSubject = (id: string) => {
    setData(prev => ({ ...prev, subjects: prev.subjects.filter(s => s.id !== id) }))
    setGenerationResult(null)
  }

  const addClass = (classItem: Class) => {
    setData(prev => ({ ...prev, classes: [...prev.classes, classItem] }))
    setGenerationResult(null)
  }

  const removeClass = (id: string) => {
    setData(prev => ({ ...prev, classes: prev.classes.filter(c => c.id !== id) }))
    setGenerationResult(null)
  }

  const resetData = () => {
    setData(initialData)
    setGenerationResult(null)
    if (typeof window !== 'undefined' && user) {
      const userKey = `schedule-builder-data-${user.id}`
      const generationKey = `schedule-builder-generation-${user.id}`
      localStorage.removeItem(userKey)
      localStorage.removeItem(generationKey)
    }
  }

  return (
    <ScheduleBuilderContext.Provider value={{
      data,
      generationResult,
      updateTeachers,
      updateTeacher,
      updateTeacherClassroom,
      updateClassrooms,
      updateSubjects,
      updateSubject,
      updateClasses,
      addTeacher,
      removeTeacher,
      addClassroom,
      removeClassroom,
      addSubject,
      removeSubject,
      addClass,
      removeClass,
      setGenerationResult,
      resetData
    }}>
      {children}
    </ScheduleBuilderContext.Provider>
  )
}

export const useScheduleBuilder = () => {
  const context = useContext(ScheduleBuilderContext)
  if (context === undefined) {
    throw new Error('useScheduleBuilder must be used within a ScheduleBuilderProvider')
  }
  return context
}
