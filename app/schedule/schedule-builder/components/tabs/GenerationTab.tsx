'use client'

import { useState, useEffect } from 'react'
import { Play, Download, AlertTriangle, CheckCircle, RefreshCw, Users, BookOpen, Calendar, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react'
import { useScheduleBuilder } from '../../context/ScheduleBuilderContext'
import { TabType } from '../../page'
import * as XLSX from 'xlsx'

interface GenerationTabProps {
  onUpdateStatus: (tabId: TabType, completed: boolean, hasErrors?: boolean) => void
}

interface ScheduleConflict {
  type: 'teacher' | 'classroom' | 'load' | 'elementary' | 'difficult_subjects' | 'resource_conflict'
  message: string
  severity: 'error' | 'warning'
  details?: string
  recommendation?: string
  className?: string
  teacherName?: string
  subjectName?: string
  day?: string
  lesson?: number
}

interface ScheduleSlot {
  day: string
  lesson: number
  className: string
  subjectId: string
  teacherId: string
  classroomId: string
  group?: string
}

interface ConstraintViolation {
  type: 'hard' | 'soft'
  constraint: string
  message: string
  severity: 'error' | 'warning'
  weight?: number
  details?: string
  recommendation?: string
}

interface ScheduleConstraints {
  // Жесткие ограничения
  resourceUniqueness: boolean
  teacherAvailability: boolean
  classroomAvailability: boolean
  loadFulfillment: boolean
  elementaryRules: boolean
  difficultSubjectsSpacing: boolean
  
  // Мягкие ограничения
  minimizeGaps: { enabled: boolean; weight: number }
  avoidExtremeSlots: { enabled: boolean; weight: number }
  distributeDifficultSubjects: { enabled: boolean; weight: number }
  preferAssignedClassrooms: { enabled: boolean; weight: number }
}

interface SanPinViolation {
  type: 'max_lessons' | 'difficult_subjects' | 'consecutive_difficult' | 'physical_education' | 'control_works' | 'start_time'
  message: string
  severity: 'error' | 'warning'
  className?: string
  day?: string
  details?: string
}

interface StudentSchedule {
  day: string
  className: string
  lessonNumber: number
  subjectName: string
  classroomName: string
}

interface TeacherSchedule {
  teacherName: string
  day: string
  lessonNumber: number
  subjectName: string
  className: string
}

type ScheduleTab = 'students' | 'teachers'

export const GenerationTab = ({ onUpdateStatus }: GenerationTabProps) => {
  const { data, resetData, generationResult, setGenerationResult } = useScheduleBuilder()
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<ScheduleTab>('students')
  const [isConflictsExpanded, setIsConflictsExpanded] = useState(false)
  const [constraints, setConstraints] = useState<ScheduleConstraints>({
    // Жесткие ограничения (всегда включены)
    resourceUniqueness: true,
    teacherAvailability: true,
    classroomAvailability: true,
    loadFulfillment: true,
    elementaryRules: true,
    difficultSubjectsSpacing: true,
    
    // Мягкие ограничения
    minimizeGaps: { enabled: true, weight: 10 },
    avoidExtremeSlots: { enabled: true, weight: 5 },
    distributeDifficultSubjects: { enabled: true, weight: 8 },
    preferAssignedClassrooms: { enabled: true, weight: 3 }
  })
  const [violations, setViolations] = useState<ConstraintViolation[]>([])
  const [generationProgress, setGenerationProgress] = useState(0)
  const [sanPinViolations, setSanPinViolations] = useState<SanPinViolation[]>([])
  const [isSanPinExpanded, setIsSanPinExpanded] = useState(false)
  const [isCheckingSanPin, setIsCheckingSanPin] = useState(false)

  useEffect(() => {
    const canGenerate = data.teachers.length > 0 && 
                       data.classrooms.length > 0 && 
                       data.subjects.length > 0 && 
                       data.classes.length > 0
    
    onUpdateStatus('generation', canGenerate, false)
  }, [data])

  // Функции проверки жестких ограничений
  const checkResourceUniqueness = (schedule: ScheduleSlot[]): ConstraintViolation[] => {
    const violations: ConstraintViolation[] = []
    
    // Проверка уникальности для классов
    const classSlots: {[key: string]: {[day: string]: {[lesson: number]: boolean}}} = {}
    const teacherSlots: {[key: string]: {[day: string]: {[lesson: number]: boolean}}} = {}
    const classroomSlots: {[key: string]: {[day: string]: {[lesson: number]: boolean}}} = {}
    
    schedule.forEach(slot => {
      const classKey = `${slot.className}`
      const teacherKey = slot.teacherId
      const classroomKey = slot.classroomId
      
      // Инициализация
      if (!classSlots[classKey]) classSlots[classKey] = {}
      if (!classSlots[classKey][slot.day]) classSlots[classKey][slot.day] = {}
      if (!teacherSlots[teacherKey]) teacherSlots[teacherKey] = {}
      if (!teacherSlots[teacherKey][slot.day]) teacherSlots[teacherKey][slot.day] = {}
      if (!classroomSlots[classroomKey]) classroomSlots[classroomKey] = {}
      if (!classroomSlots[classroomKey][slot.day]) classroomSlots[classroomKey][slot.day] = {}
      
      // Проверка конфликтов
      if (classSlots[classKey][slot.day][slot.lesson]) {
        violations.push({
          type: 'hard',
          constraint: 'resourceUniqueness',
          message: `Класс ${slot.className} имеет два урока в ${slot.day} на ${slot.lesson} уроке`,
          severity: 'error',
          details: 'Класс не может иметь более одного урока в одном временном слоте'
        })
      }
      
      if (teacherSlots[teacherKey][slot.day][slot.lesson]) {
        const teacher = data.teachers.find(t => t.id === teacherKey)
        violations.push({
          type: 'hard',
          constraint: 'resourceUniqueness',
          message: `Учитель ${teacher?.lastName} ${teacher?.firstName} ведет два урока в ${slot.day} на ${slot.lesson} уроке`,
          severity: 'error',
          details: 'Учитель не может вести более одного урока одновременно'
        })
      }
      
      if (classroomSlots[classroomKey][slot.day][slot.lesson]) {
        const classroom = data.classrooms.find(c => c.id === classroomKey)
        violations.push({
          type: 'hard',
          constraint: 'resourceUniqueness',
          message: `Кабинет ${classroom?.name} занят двумя уроками в ${slot.day} на ${slot.lesson} уроке`,
          severity: 'error',
          details: 'Кабинет не может быть занят двумя уроками одновременно'
        })
      }
      
      // Отмечаем занятость
      classSlots[classKey][slot.day][slot.lesson] = true
      teacherSlots[teacherKey][slot.day][slot.lesson] = true
      classroomSlots[classroomKey][slot.day][slot.lesson] = true
    })
    
    return violations
  }

  const checkTeacherAvailability = (schedule: ScheduleSlot[]): ConstraintViolation[] => {
    const violations: ConstraintViolation[] = []
    
    schedule.forEach(slot => {
      const teacher = data.teachers.find(t => t.id === slot.teacherId)
      if (!teacher) return
      
      const dayBlockers = teacher.blockers?.[slot.day]
      if (dayBlockers) {
        if (dayBlockers.fullDay) {
          violations.push({
            type: 'hard',
            constraint: 'teacherAvailability',
            message: `Учитель ${teacher.lastName} ${teacher.firstName} недоступен в ${slot.day} (блокер на весь день)`,
            severity: 'error',
            details: 'Учитель заблокирован на весь день'
          })
        } else if (dayBlockers.lessons.includes(slot.lesson)) {
          violations.push({
            type: 'hard',
            constraint: 'teacherAvailability',
            message: `Учитель ${teacher.lastName} ${teacher.firstName} недоступен в ${slot.day} на ${slot.lesson} уроке (блокер)`,
            severity: 'error',
            details: 'Учитель заблокирован на этот временной слот'
          })
        }
      }
    })
    
    return violations
  }

  const checkLoadFulfillment = (schedule: ScheduleSlot[]): ConstraintViolation[] => {
    const violations: ConstraintViolation[] = []
    
    data.classes.forEach(classItem => {
      Object.entries(classItem.subjects).forEach(([subjectId, subjectData]) => {
        const load = typeof subjectData === 'object' ? subjectData.load : subjectData
        if (load <= 0) return
        
        const subject = data.subjects.find(s => s.id === subjectId)
        if (!subject) return
        
        // Подсчитываем размещенные уроки для этого предмета в классе
        const placedLessons = schedule.filter(slot => 
          slot.className === classItem.name && slot.subjectId === subjectId
        ).length
        
        if (placedLessons !== load) {
          violations.push({
            type: 'hard',
            constraint: 'loadFulfillment',
            message: `Нагрузка ${classItem.name} ${subject.name}: требуется ${load} слотов, размещено ${placedLessons}`,
            severity: 'error',
            details: 'Количество уроков по предмету должно соответствовать заданной нагрузке',
            className: classItem.name,
            subjectName: subject.name
          })
        }
      })
    })
    
    return violations
  }

  const checkElementaryRules = (schedule: ScheduleSlot[]): ConstraintViolation[] => {
    const violations: ConstraintViolation[] = []
    
    data.classes.forEach(classItem => {
      if (!classItem.isElementary || !classItem.classTeacher) return
      
      // Проверяем, что все предметы начальных классов ведет классный руководитель
      const elementaryLessons = schedule.filter(slot => 
        slot.className === classItem.name
      )
      
      elementaryLessons.forEach(slot => {
        if (slot.teacherId !== classItem.classTeacher) {
          const teacher = data.teachers.find(t => t.id === slot.teacherId)
          const classTeacher = data.teachers.find(t => t.id === classItem.classTeacher)
          violations.push({
            type: 'hard',
            constraint: 'elementaryRules',
            message: `Начальная школа: предмет ${slot.subjectId} в классе ${classItem.name} ведет ${teacher?.lastName} ${teacher?.firstName} вместо классного руководителя ${classTeacher?.lastName} ${classTeacher?.firstName}`,
            severity: 'error',
            details: 'В начальной школе предметы должны вестись классным руководителем',
            className: classItem.name
          })
        }
      })
    })
    
    return violations
  }

  // Функции проверки мягких ограничений
  const checkMinimizeGaps = (schedule: ScheduleSlot[]): ConstraintViolation[] => {
    const violations: ConstraintViolation[] = []
    
    // Группируем уроки по классам и дням
    const classDayLessons: {[className: string]: {[day: string]: number[]}} = {}
    
    schedule.forEach(slot => {
      if (!classDayLessons[slot.className]) classDayLessons[slot.className] = {}
      if (!classDayLessons[slot.className][slot.day]) classDayLessons[slot.className][slot.day] = []
      classDayLessons[slot.className][slot.day].push(slot.lesson)
    })
    
    // Проверяем окна в расписании
    Object.entries(classDayLessons).forEach(([className, dayLessons]) => {
      Object.entries(dayLessons).forEach(([day, lessons]) => {
        const sortedLessons = lessons.sort((a, b) => a - b)
        
        for (let i = 0; i < sortedLessons.length - 1; i++) {
          const gap = sortedLessons[i + 1] - sortedLessons[i]
          if (gap > 1) {
            violations.push({
              type: 'soft',
              constraint: 'minimizeGaps',
              message: `Класс ${className} имеет окно в ${day} между ${sortedLessons[i]} и ${sortedLessons[i + 1]} уроками`,
              severity: 'warning',
              weight: constraints.minimizeGaps.weight * gap,
              details: 'Окна в расписании нежелательны',
              recommendation: 'Попробуйте переставить уроки для устранения окна'
            })
          }
        }
      })
    })
    
    return violations
  }

  const checkAvoidExtremeSlots = (schedule: ScheduleSlot[]): ConstraintViolation[] => {
    const violations: ConstraintViolation[] = []
    
    schedule.forEach(slot => {
      const subject = data.subjects.find(s => s.id === slot.subjectId)
      if (!subject) return
      
      // Проверяем сложные предметы в крайних слотах
      if (subject.difficulty === 'hard') {
        if (slot.lesson === 1) {
          violations.push({
            type: 'soft',
            constraint: 'avoidExtremeSlots',
            message: `Сложный предмет ${subject.name} в классе ${slot.className} стоит на 1 уроке в ${slot.day}`,
            severity: 'warning',
            weight: constraints.avoidExtremeSlots.weight,
            details: 'Сложные предметы нежелательны в первом уроке',
            recommendation: 'Попробуйте переместить урок на более позднее время'
          })
        } else if (slot.lesson >= 7) {
          violations.push({
            type: 'soft',
            constraint: 'avoidExtremeSlots',
            message: `Сложный предмет ${subject.name} в классе ${slot.className} стоит на ${slot.lesson} уроке в ${slot.day}`,
            severity: 'warning',
            weight: constraints.avoidExtremeSlots.weight,
            details: 'Сложные предметы нежелательны в поздних уроках',
            recommendation: 'Попробуйте переместить урок на более раннее время'
          })
        }
      }
    })
    
    return violations
  }

  const checkDistributeDifficultSubjects = (schedule: ScheduleSlot[]): ConstraintViolation[] => {
    const violations: ConstraintViolation[] = []
    
    // Группируем сложные предметы по классам и дням
    const classDayDifficult: {[className: string]: {[day: string]: number}} = {}
    
    schedule.forEach(slot => {
      const subject = data.subjects.find(s => s.id === slot.subjectId)
      if (subject?.difficulty === 'hard') {
        if (!classDayDifficult[slot.className]) classDayDifficult[slot.className] = {}
        classDayDifficult[slot.className][slot.day] = (classDayDifficult[slot.className][slot.day] || 0) + 1
      }
    })
    
    // Проверяем неравномерное распределение
    Object.entries(classDayDifficult).forEach(([className, dayCounts]) => {
      const counts = Object.values(dayCounts)
      const maxCount = Math.max(...counts)
      const minCount = Math.min(...counts)
      
      if (maxCount - minCount > 1) {
        violations.push({
          type: 'soft',
          constraint: 'distributeDifficultSubjects',
          message: `Класс ${className} имеет неравномерное распределение сложных предметов по дням (от ${minCount} до ${maxCount} в день)`,
          severity: 'warning',
          weight: constraints.distributeDifficultSubjects.weight * (maxCount - minCount),
          details: 'Сложные предметы должны быть равномерно распределены по неделе',
          recommendation: 'Попробуйте перераспределить сложные предметы между днями'
        })
      }
    })
    
    return violations
  }

  const checkPreferAssignedClassrooms = (schedule: ScheduleSlot[]): ConstraintViolation[] => {
    const violations: ConstraintViolation[] = []
    
    schedule.forEach(slot => {
      const teacher = data.teachers.find(t => t.id === slot.teacherId)
      const classroom = data.classrooms.find(c => c.id === slot.classroomId)
      
      if (teacher?.classroomId && teacher.classroomId !== slot.classroomId) {
        violations.push({
          type: 'soft',
          constraint: 'preferAssignedClassrooms',
          message: `Учитель ${teacher.lastName} ${teacher.firstName} ведет урок не в своем закрепленном кабинете`,
          severity: 'warning',
          weight: constraints.preferAssignedClassrooms.weight,
          details: 'Учитель предпочитает вести уроки в закрепленном кабинете',
          recommendation: 'Попробуйте назначить урок в закрепленный кабинет учителя'
        })
      }
    })
    
    return violations
  }

  const validateData = (): ScheduleConflict[] => {
    const conflicts: ScheduleConflict[] = []

    // Проверка учителей
    if (data.teachers.length === 0) {
      conflicts.push({
        type: 'teacher',
        message: 'Не добавлено ни одного учителя',
        severity: 'error'
      })
    }

    // Проверка кабинетов
    if (data.classrooms.length === 0) {
      conflicts.push({
        type: 'classroom',
        message: 'Не добавлено ни одного кабинета',
        severity: 'error'
      })
    }

    // Проверка предметов
    if (data.subjects.length === 0) {
      conflicts.push({
        type: 'load',
        message: 'Не добавлено ни одного предмета',
        severity: 'error'
      })
    }

    // Проверка классов
    if (data.classes.length === 0) {
      conflicts.push({
        type: 'load',
        message: 'Не добавлено ни одного класса',
        severity: 'error'
      })
    }

    // Проверка нагрузок
    const hasLoads = data.classes.some(classItem => 
      Object.values(classItem.subjects).some(load => load > 0)
    )

    if (!hasLoads) {
      conflicts.push({
        type: 'load',
        message: 'Не настроены нагрузки по предметам для классов',
        severity: 'error'
      })
    }

    return conflicts
  }

  // Новая функция генерации расписания с проверкой ограничений
  const generateAdvancedSchedule = (): { studentSchedule: StudentSchedule[], teacherSchedule: TeacherSchedule[], violations: ConstraintViolation[] } => {
    const violations: ConstraintViolation[] = []
    const studentSchedule: StudentSchedule[] = []
    const teacherSchedule: TeacherSchedule[] = []
    const schedule: ScheduleSlot[] = []
    
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    const maxLessonsPerDay = 8
    
    // Создаем матрицы занятости
    const classroomOccupancy: {[key: string]: {[day: string]: {[lesson: number]: boolean}}} = {}
    const teacherOccupancy: {[key: string]: {[day: string]: {[lesson: number]: boolean}}} = {}
    const classOccupancy: {[key: string]: {[day: string]: {[lesson: number]: boolean}}} = {}
    
    // Инициализация матриц
    data.classrooms.forEach(classroom => {
      classroomOccupancy[classroom.id] = {}
      days.forEach(day => {
        classroomOccupancy[classroom.id][day] = {}
        for (let lesson = 1; lesson <= maxLessonsPerDay; lesson++) {
          classroomOccupancy[classroom.id][day][lesson] = false
        }
      })
    })
    
    data.teachers.forEach(teacher => {
      teacherOccupancy[teacher.id] = {}
      days.forEach(day => {
        teacherOccupancy[teacher.id][day] = {}
        for (let lesson = 1; lesson <= maxLessonsPerDay; lesson++) {
          teacherOccupancy[teacher.id][day][lesson] = false
        }
      })
    })
    
    data.classes.forEach(classItem => {
      classOccupancy[classItem.name] = {}
      days.forEach(day => {
        classOccupancy[classItem.name][day] = {}
        for (let lesson = 1; lesson <= maxLessonsPerDay; lesson++) {
          classOccupancy[classItem.name][day][lesson] = false
        }
      })
    })
    
    // Применяем блокеры учителей
    data.teachers.forEach(teacher => {
      Object.entries(teacher.blockers || {}).forEach(([day, blocker]) => {
        if (blocker.fullDay) {
          for (let lesson = 1; lesson <= maxLessonsPerDay; lesson++) {
            teacherOccupancy[teacher.id][day][lesson] = true
          }
        } else {
          blocker.lessons.forEach(lesson => {
            teacherOccupancy[teacher.id][day][lesson] = true
          })
        }
      })
    })
    
    // Собираем все уроки для размещения
    const lessonsToPlace: Array<{
      classItem: any
      subjectId: string
      subject: any
      load: number
      teacherId: string
      groups?: string[]
    }> = []
    
    data.classes.forEach(classItem => {
      Object.entries(classItem.subjects).forEach(([subjectId, subjectData]) => {
        const load = typeof subjectData === 'object' ? subjectData.load : subjectData
        if (load <= 0) return
        
        const subject = data.subjects.find(s => s.id === subjectId)
        if (!subject) return
        
        let teacherId: string
        
        // Определяем учителя
        if (classItem.isElementary && classItem.classTeacher) {
          // Для начальных классов используем классного руководителя
          teacherId = classItem.classTeacher
        } else {
          // Для старших классов используем назначенного учителя или первого доступного
          const subjectDataObj = typeof subjectData === 'object' ? subjectData : { load, teacherId: undefined, groups: undefined }
          teacherId = subjectDataObj.teacherId || data.teachers.find(t => t.subjects?.includes(subjectId))?.id || ''
        }
        
        if (!teacherId) {
          violations.push({
            type: 'hard',
            constraint: 'teacherAvailability',
            message: `Не найден учитель для предмета ${subject.name} в классе ${classItem.name}`,
            severity: 'error',
            details: 'Для каждого предмета должен быть назначен учитель'
          })
          return
        }
        
        // Добавляем уроки для размещения
        for (let i = 0; i < load; i++) {
          lessonsToPlace.push({
            classItem,
            subjectId,
            subject,
            load: 1,
            teacherId,
            groups: typeof subjectData === 'object' ? subjectData.groups : undefined
          })
        }
      })
    })
    
    // Алгоритм размещения уроков
    lessonsToPlace.forEach((lesson, index) => {
      setGenerationProgress(Math.round((index / lessonsToPlace.length) * 100))
      
      let placed = false
      
      // Пробуем разместить урок
      for (let dayIndex = 0; dayIndex < days.length && !placed; dayIndex++) {
        const day = days[dayIndex]
        
        for (let lessonNum = 1; lessonNum <= maxLessonsPerDay && !placed; lessonNum++) {
          // Проверяем доступность ресурсов
          if (classOccupancy[lesson.classItem.name][day][lessonNum]) continue
          if (teacherOccupancy[lesson.teacherId][day][lessonNum]) continue
          
          // Находим подходящий кабинет
          const availableClassroom = data.classrooms.find(classroom => {
            if (classroomOccupancy[classroom.id][day][lessonNum]) return false
            
            // Проверяем совместимость предмета и кабинета
            if (classroom.supportedSubjects && classroom.supportedSubjects.length > 0) {
              return classroom.supportedSubjects.includes(lesson.subjectId)
            }
            
            return true
          })
          
          if (!availableClassroom) continue
          
          // Проверяем правила для сложных предметов
          if (lesson.subject.difficulty === 'hard' && constraints.difficultSubjectsSpacing) {
            // Проверяем, что сложные предметы не стоят подряд
            const prevLesson = schedule.find(s => 
              s.day === day && 
              s.className === lesson.classItem.name && 
              s.lesson === lessonNum - 1
            )
            if (prevLesson) {
              const prevSubject = data.subjects.find(s => s.id === prevLesson.subjectId)
              if (prevSubject?.difficulty === 'hard') continue
            }
          }
          
          // Размещаем урок
          const slot: ScheduleSlot = {
            day,
            lesson: lessonNum,
            className: lesson.classItem.name,
            subjectId: lesson.subjectId,
            teacherId: lesson.teacherId,
            classroomId: availableClassroom.id,
            group: lesson.groups?.[index % (lesson.groups?.length || 1)]
          }
          
          schedule.push(slot)
          
          // Отмечаем занятость
          classOccupancy[lesson.classItem.name][day][lessonNum] = true
          teacherOccupancy[lesson.teacherId][day][lessonNum] = true
          classroomOccupancy[availableClassroom.id][day][lessonNum] = true
          
          placed = true
        }
      }
      
      if (!placed) {
        violations.push({
          type: 'hard',
          constraint: 'loadFulfillment',
          message: `Не удалось разместить урок ${lesson.subject.name} для класса ${lesson.classItem.name}`,
          severity: 'error',
          details: 'Недостаточно свободных слотов для размещения всех уроков',
          recommendation: 'Проверьте доступность учителей и кабинетов, возможно нужно добавить больше ресурсов'
        })
      }
    })
    
    // Проверяем все ограничения
    if (constraints.resourceUniqueness) {
      violations.push(...checkResourceUniqueness(schedule))
    }
    if (constraints.teacherAvailability) {
      violations.push(...checkTeacherAvailability(schedule))
    }
    if (constraints.loadFulfillment) {
      violations.push(...checkLoadFulfillment(schedule))
    }
    if (constraints.elementaryRules) {
      violations.push(...checkElementaryRules(schedule))
    }
    
    // Проверяем мягкие ограничения
    if (constraints.minimizeGaps.enabled) {
      violations.push(...checkMinimizeGaps(schedule))
    }
    if (constraints.avoidExtremeSlots.enabled) {
      violations.push(...checkAvoidExtremeSlots(schedule))
    }
    if (constraints.distributeDifficultSubjects.enabled) {
      violations.push(...checkDistributeDifficultSubjects(schedule))
    }
    if (constraints.preferAssignedClassrooms.enabled) {
      violations.push(...checkPreferAssignedClassrooms(schedule))
    }
    
    // Конвертируем в формат для отображения
    schedule.forEach(slot => {
      const subject = data.subjects.find(s => s.id === slot.subjectId)
      const teacher = data.teachers.find(t => t.id === slot.teacherId)
      const classroom = data.classrooms.find(c => c.id === slot.classroomId)
      
      if (subject && teacher && classroom) {
        studentSchedule.push({
          day: slot.day,
          className: slot.className,
          lessonNumber: slot.lesson,
          subjectName: subject.name,
          classroomName: classroom.name
        })
        
        teacherSchedule.push({
          teacherName: `${teacher.lastName} ${teacher.firstName}`,
          day: slot.day,
          lessonNumber: slot.lesson,
          subjectName: subject.name,
          className: slot.className
        })
      }
    })
    
    return { studentSchedule, teacherSchedule, violations }
  }

  const generateSchedule = (): { studentSchedule: StudentSchedule[], teacherSchedule: TeacherSchedule[], conflicts: ScheduleConflict[] } => {
    const conflicts: ScheduleConflict[] = []
    const studentSchedule: StudentSchedule[] = []
    const teacherSchedule: TeacherSchedule[] = []
    
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    const maxLessonsPerDay = 8
    
    // Создаем матрицу занятости кабинетов
    const classroomOccupancy: {[key: string]: {[day: string]: {[lesson: number]: boolean}}} = {}
    data.classrooms.forEach(classroom => {
      classroomOccupancy[classroom.id] = {}
      days.forEach(day => {
        classroomOccupancy[classroom.id][day] = {}
        for (let lesson = 1; lesson <= maxLessonsPerDay; lesson++) {
          classroomOccupancy[classroom.id][day][lesson] = false
        }
      })
    })
    
    // Создаем матрицу занятости учителей
    const teacherOccupancy: {[key: string]: {[day: string]: {[lesson: number]: boolean}}} = {}
    data.teachers.forEach(teacher => {
      teacherOccupancy[teacher.id] = {}
      days.forEach(day => {
        teacherOccupancy[teacher.id][day] = {}
        for (let lesson = 1; lesson <= maxLessonsPerDay; lesson++) {
          teacherOccupancy[teacher.id][day][lesson] = false
        }
      })
    })
    
    // Применяем блокеры учителей
    data.teachers.forEach(teacher => {
      Object.entries(teacher.blockers || {}).forEach(([day, blocker]) => {
        if (blocker.fullDay) {
          for (let lesson = 1; lesson <= maxLessonsPerDay; lesson++) {
            teacherOccupancy[teacher.id][day][lesson] = true
          }
        } else {
          blocker.lessons.forEach(lesson => {
            teacherOccupancy[teacher.id][day][lesson] = true
          })
        }
      })
    })
    
    // Генерируем расписание для каждого класса
    data.classes.forEach(classItem => {
      const classSubjects = Object.entries(classItem.subjects)
        .filter(([_, load]) => load > 0)
        .map(([subjectId, load]) => {
          const subject = data.subjects.find(s => s.id === subjectId)
          return subject ? { ...subject, load } : null
        })
        .filter(Boolean)
      
      // Распределяем уроки по дням
      classSubjects.filter((item): item is NonNullable<typeof item> => item !== null).forEach(({ id: subjectId, name: subjectName, load, difficulty, isGrouped }) => {
        const subject = data.subjects.find(s => s.id === subjectId)!
        
        // Находим учителя для этого предмета
        const teacher = data.teachers.find(t => t.subjects?.includes(subjectId))
        if (!teacher) return
        
        let lessonsPlaced = 0
        
        // Пытаемся разместить уроки
        for (let week = 0; week < Math.ceil(load / 5); week++) {
          for (let dayIndex = 0; dayIndex < days.length && lessonsPlaced < load; dayIndex++) {
            const day = days[dayIndex]
            
            // Находим свободный урок в этот день
            for (let lesson = 1; lesson <= maxLessonsPerDay && lessonsPlaced < load; lesson++) {
              // Проверяем, свободен ли учитель
              if (teacherOccupancy[teacher.id][day][lesson]) continue
              
              // Проверяем, свободен ли кабинет
              const availableClassroom = data.classrooms.find(classroom => 
                !classroomOccupancy[classroom.id][day][lesson]
              )
              if (!availableClassroom) continue
              
              // Проверяем, что сложные предметы не стоят подряд
              if (difficulty === 'hard') {
                const prevLesson = studentSchedule.find(s => 
                  s.day === day && 
                  s.className === classItem.name && 
                  s.lessonNumber === lesson - 1
                )
                if (prevLesson) {
                  const prevSubject = data.subjects.find(s => s.name === prevLesson.subjectName)
                  if (prevSubject?.difficulty === 'hard') continue
                }
              }
              
              // Размещаем урок
              const studentEntry: StudentSchedule = {
                day,
                className: classItem.name,
                lessonNumber: lesson,
                subjectName,
                classroomName: availableClassroom.name
              }
              
              const teacherEntry: TeacherSchedule = {
                teacherName: `${teacher.lastName} ${teacher.firstName}${teacher.middleName ? ` ${teacher.middleName}` : ''}`,
                day,
                lessonNumber: lesson,
                subjectName,
                className: classItem.name
              }
              
              studentSchedule.push(studentEntry)
              teacherSchedule.push(teacherEntry)
              
              // Помечаем как занятые
              classroomOccupancy[availableClassroom.id][day][lesson] = true
              teacherOccupancy[teacher.id][day][lesson] = true
              
              lessonsPlaced++
            }
          }
        }
        
        if (lessonsPlaced < load) {
          const missingLessons = load - lessonsPlaced
          
          // Детальный анализ причин
          const reasons = []
          
          // Проверяем доступность учителя
          let teacherAvailableSlots = 0
          days.forEach(day => {
            for (let lesson = 1; lesson <= maxLessonsPerDay; lesson++) {
              if (!teacherOccupancy[teacher.id][day][lesson]) {
                teacherAvailableSlots++
              }
            }
          })
          
          if (teacherAvailableSlots < missingLessons) {
            reasons.push(`Учитель "${teacher.lastName} ${teacher.firstName}" имеет только ${teacherAvailableSlots} свободных слотов`)
          }
          
          // Проверяем доступность кабинетов
          let classroomAvailableSlots = 0
          days.forEach(day => {
            for (let lesson = 1; lesson <= maxLessonsPerDay; lesson++) {
              const hasAvailableClassroom = data.classrooms.some(classroom => 
                !classroomOccupancy[classroom.id][day][lesson]
              )
              if (hasAvailableClassroom) {
                classroomAvailableSlots++
              }
            }
          })
          
          if (classroomAvailableSlots < missingLessons) {
            reasons.push(`Доступно только ${classroomAvailableSlots} свободных слотов в кабинетах`)
          }
          
          // Проверяем блокеры учителя
          const teacherBlockers = Object.entries(teacher.blockers || {})
            .filter(([_, blocker]) => blocker.fullDay || blocker.lessons.length > 0)
            .map(([day, blocker]) => {
              if (blocker.fullDay) {
                return `полный день в ${day}`
              } else {
                return `${day} (уроки: ${blocker.lessons.join(', ')})`
              }
            })
          
          if (teacherBlockers.length > 0) {
            reasons.push(`Блокеры учителя: ${teacherBlockers.join(', ')}`)
          }
          
          // Проверяем ограничения по сложности
          if (difficulty === 'hard') {
            reasons.push(`Сложный предмет "${subjectName}" не может стоять подряд с другими сложными предметами`)
          }
          
          // Проверяем общую загруженность класса
          const classTotalLessons = Object.values(classItem.subjects).reduce((sum, subjectLoad) => sum + subjectLoad, 0)
          const maxPossibleLessons = days.length * maxLessonsPerDay
          
          if (classTotalLessons > maxPossibleLessons) {
            reasons.push(`Класс перегружен: ${classTotalLessons} уроков при максимуме ${maxPossibleLessons}`)
          }
          
          const detailedMessage = reasons.length > 0 
            ? `⚠️ Не удалось разместить ${missingLessons} из ${load} уроков "${subjectName}" для класса ${classItem.name}.\n\n🔍 Причины:\n• ${reasons.join('\n• ')}`
            : `⚠️ Не удалось разместить ${missingLessons} из ${load} уроков "${subjectName}" для класса ${classItem.name}.`
          
          conflicts.push({
            type: 'load',
            message: detailedMessage,
            severity: 'warning'
          })
        }
      })
    })
    
    return { studentSchedule, teacherSchedule, conflicts }
  }

  const checkSanPinCompliance = (schedule: StudentSchedule[]): SanPinViolation[] => {
    const violations: SanPinViolation[] = []
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    
    // Группируем расписание по классам и дням
    const scheduleByClass: {[className: string]: {[day: string]: StudentSchedule[]}} = {}
    schedule.forEach(lesson => {
      if (!scheduleByClass[lesson.className]) {
        scheduleByClass[lesson.className] = {}
      }
      if (!scheduleByClass[lesson.className][lesson.day]) {
        scheduleByClass[lesson.className][lesson.day] = []
      }
      scheduleByClass[lesson.className][lesson.day].push(lesson)
    })

    // Определяем сложность предметов
    const getSubjectDifficulty = (subjectName: string): 'easy' | 'medium' | 'hard' => {
      const subject = data.subjects.find(s => s.name === subjectName)
      if (!subject) return 'medium'
      return (subject.difficulty as 'easy' | 'medium' | 'hard') || 'medium'
    }

    // Проверяем каждый класс
    Object.entries(scheduleByClass).forEach(([className, classSchedule]) => {
      const classNumber = parseInt(className.match(/\d+/)?.[0] || '0')
      
      days.forEach(day => {
        const dayLessons = classSchedule[day] || []
        const lessonsCount = dayLessons.length
        
        // 1. Проверка максимального количества уроков в день
        let maxLessonsAllowed = 7
        if (classNumber >= 1 && classNumber <= 4) {
          maxLessonsAllowed = classNumber === 1 ? 4 : 5
        } else if (classNumber >= 5 && classNumber <= 6) {
          maxLessonsAllowed = 6
        }
        
        if (lessonsCount > maxLessonsAllowed) {
          violations.push({
            type: 'max_lessons',
            message: `Превышено максимальное количество уроков в день для класса ${className}`,
            severity: 'error',
            className,
            day,
            details: `Допустимо: ${maxLessonsAllowed}, фактически: ${lessonsCount}`
          })
        }

        // 2. Проверка сложных предметов в начале дня
        const difficultSubjects = dayLessons.filter(lesson => 
          getSubjectDifficulty(lesson.subjectName) === 'hard'
        )
        
        if (difficultSubjects.length > 0) {
          const firstDifficultLesson = difficultSubjects[0]
          if (firstDifficultLesson.lessonNumber > 3) {
            violations.push({
              type: 'difficult_subjects',
              message: `Сложные предметы должны быть в первой половине дня для класса ${className}`,
              severity: 'warning',
              className,
              day,
              details: `Сложный предмет "${firstDifficultLesson.subjectName}" на ${firstDifficultLesson.lessonNumber} уроке`
            })
          }
        }

        // 3. Проверка двух сложных предметов подряд
        for (let i = 0; i < dayLessons.length - 1; i++) {
          const currentLesson = dayLessons[i]
          const nextLesson = dayLessons[i + 1]
          
          if (getSubjectDifficulty(currentLesson.subjectName) === 'hard' && 
              getSubjectDifficulty(nextLesson.subjectName) === 'hard') {
            violations.push({
              type: 'consecutive_difficult',
              message: `Два сложных предмета подряд для класса ${className}`,
              severity: 'error',
              className,
              day,
              details: `"${currentLesson.subjectName}" (${currentLesson.lessonNumber} урок) → "${nextLesson.subjectName}" (${nextLesson.lessonNumber} урок)`
            })
          }
        }

        // 4. Проверка физкультуры первым уроком
        const firstLesson = dayLessons.find(lesson => lesson.lessonNumber === 1)
        if (firstLesson && firstLesson.subjectName.toLowerCase().includes('физкультура')) {
          violations.push({
            type: 'physical_education',
            message: `Физкультура не должна быть первым уроком для класса ${className}`,
            severity: 'error',
            className,
            day,
            details: 'Физкультура должна быть не ранее 2-3 урока'
          })
        }

        // 5. Проверка физкультуры в расписании (минимум 3 раза в неделю)
        if (day === 'Понедельник') { // Проверяем только в понедельник для недельного анализа
          const weeklyLessons = Object.values(classSchedule).flat()
          const physicalEducationCount = weeklyLessons.filter(lesson => 
            lesson.subjectName.toLowerCase().includes('физкультура')
          ).length
          
          if (physicalEducationCount < 3) {
            violations.push({
              type: 'physical_education',
              message: `Недостаточно уроков физкультуры для класса ${className}`,
              severity: 'warning',
              className,
              details: `Должно быть минимум 3 урока в неделю, фактически: ${physicalEducationCount}`
            })
          }
        }

        // 6. Проверка контрольных работ в понедельник и пятницу
        const controlWorkSubjects = ['математика', 'русский язык', 'физика', 'химия', 'биология', 'история', 'география']
        const mondayLessons = classSchedule['Понедельник'] || []
        const fridayLessons = classSchedule['Пятница'] || []
        
        const mondayControlWorks = mondayLessons.filter(lesson => 
          controlWorkSubjects.some(subject => 
            lesson.subjectName.toLowerCase().includes(subject)
          )
        )
        
        const fridayControlWorks = fridayLessons.filter(lesson => 
          controlWorkSubjects.some(subject => 
            lesson.subjectName.toLowerCase().includes(subject)
          )
        )
        
        if (mondayControlWorks.length > 0) {
          violations.push({
            type: 'control_works',
            message: `Контрольные работы не рекомендуются в понедельник для класса ${className}`,
            severity: 'warning',
            className,
            day: 'Понедельник',
            details: `Предметы: ${mondayControlWorks.map(l => l.subjectName).join(', ')}`
          })
        }
        
        if (fridayControlWorks.length > 0) {
          violations.push({
            type: 'control_works',
            message: `Контрольные работы не рекомендуются в пятницу для класса ${className}`,
            severity: 'warning',
            className,
            day: 'Пятница',
            details: `Предметы: ${fridayControlWorks.map(l => l.subjectName).join(', ')}`
          })
        }
      })
    })

    return violations
  }

  const handleCheckSanPin = async () => {
    if (!generationResult?.studentSchedule) {
      return
    }

    setIsCheckingSanPin(true)
    
    // Имитируем задержку для UX
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const violations = checkSanPinCompliance(generationResult.studentSchedule)
    setSanPinViolations(violations)
    setIsSanPinExpanded(true)
    setIsCheckingSanPin(false)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    setViolations([])
    
    // Сбрасываем результаты проверки СанПиН
    setSanPinViolations([])
    setIsSanPinExpanded(false)
    
    // Валидация данных
    const validationConflicts = validateData()
    
    if (validationConflicts.some(c => c.severity === 'error')) {
      setGenerationResult({
        success: false,
        conflicts: validationConflicts,
        studentSchedule: [],
        teacherSchedule: []
      })
      setIsGenerating(false)
      return
    }
    
    // Генерация расписания с новой системой ограничений
    try {
      const { studentSchedule, teacherSchedule, violations } = generateAdvancedSchedule()
      
      // Конвертируем violations в conflicts для совместимости
      const conflicts: ScheduleConflict[] = violations.map(violation => ({
        type: violation.constraint as any,
        message: violation.message,
        severity: violation.severity,
        details: violation.details,
        recommendation: violation.recommendation
      }))
      
      setViolations(violations)
      
      // Проверяем, есть ли критические ошибки
      const hasCriticalErrors = violations.some(v => v.type === 'hard' && v.severity === 'error')
      
      setGenerationResult({
        success: !hasCriticalErrors,
        conflicts,
        studentSchedule,
        teacherSchedule
      })
    } catch (error) {
      console.error('Ошибка при генерации расписания:', error)
      setGenerationResult({
        success: false,
        conflicts: [{
          type: 'load',
          message: 'Ошибка при генерации расписания',
          severity: 'error',
          details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        }],
        studentSchedule: [],
        teacherSchedule: []
      })
    }
    
    setIsGenerating(false)
    setGenerationProgress(0)
  }

  const exportToExcel = () => {
    if (!generationResult?.success) return

    const workbook = XLSX.utils.book_new()

    // Группируем расписание по классам
    const scheduleByClass = generationResult.studentSchedule.reduce((acc, lesson) => {
      if (!acc[lesson.className]) acc[lesson.className] = {}
      if (!acc[lesson.className][lesson.day]) acc[lesson.className][lesson.day] = {}
      acc[lesson.className][lesson.day][lesson.lessonNumber] = lesson
      return acc
    }, {} as {[className: string]: {[day: string]: {[lessonNumber: number]: StudentSchedule}}})

    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    const maxLessons = 8

    // ===== ЛИСТ 1: РАСПИСАНИЕ ПО КЛАССАМ =====
    const studentData: (string | number)[][] = []
    
    Object.entries(scheduleByClass).forEach(([className, classSchedule], classIndex) => {
      if (classIndex > 0) {
        // Добавляем пустую строку между классами
        studentData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      }
      
      // Заголовок класса - только первая ячейка содержит название, остальные пустые для объединения
      studentData.push([`Класс - ${className}`, '', '', '', '', '', '', '', '', '', '', '', '', ''])
      
      // Заголовки колонок с разделителями
      studentData.push([
        '№', 'Понедельник', '', 'Вторник', '', 'Среда', '', 'Четверг', '', 'Пятница', '', 'Суббота', '', ''
      ])
      studentData.push([
        '', 'Предмет', 'Каб.', 'Предмет', 'Каб.', 'Предмет', 'Каб.', 'Предмет', 'Каб.', 'Предмет', 'Каб.', 'Предмет', 'Каб.', ''
      ])
      // Разделительная линия
      studentData.push([
        '═══', '═══════════════', '════', '═══════════════', '════', '═══════════════', '════', '═══════════════', '════', '═══════════════', '════', '═══════════════', '════', ''
      ])

      // Строки с уроками
      for (let lessonNumber = 1; lessonNumber <= maxLessons; lessonNumber++) {
        const row: (string | number)[] = [lessonNumber]
        
        days.forEach(day => {
          const lesson = classSchedule[day]?.[lessonNumber]
          if (lesson) {
            row.push(lesson.subjectName, lesson.classroomName)
          } else {
            row.push('—', '—')
          }
        })
        row.push('') // Последний столбец пустой
        
        studentData.push(row)
      }
      
      // Добавляем разделительную линию после каждого класса
      if (classIndex < Object.entries(scheduleByClass).length - 1) {
        studentData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', ''])
        studentData.push(['▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬', '', '', '', '', '', '', '', '', '', '', '', ''])
        studentData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      }
    })

    const studentSheet = XLSX.utils.aoa_to_sheet(studentData)
    
    // Настройка ширины колонок для листа учеников
    studentSheet['!cols'] = [
      { wch: 6 },  // № (вернули обратно к 6)
      { wch: 20 }, // Понедельник предмет
      { wch: 8 },  // Понедельник каб
      { wch: 20 }, // Вторник предмет
      { wch: 8 },  // Вторник каб
      { wch: 20 }, // Среда предмет
      { wch: 8 },  // Среда каб
      { wch: 20 }, // Четверг предмет
      { wch: 8 },  // Четверг каб
      { wch: 20 }, // Пятница предмет
      { wch: 8 },  // Пятница каб
      { wch: 20 }, // Суббота предмет
      { wch: 8 },  // Суббота каб
      { wch: 8 }   // Пустой столбец
    ]

    // Объединяем ячейки для названий классов
    const merges: any[] = []
    let currentRow = 0
    
    Object.entries(scheduleByClass).forEach(([className, classSchedule], classIndex) => {
      if (classIndex > 0) {
        currentRow++ // Пропускаем пустую строку между классами
      }
      
      // Объединяем ячейки для названия класса (от колонки A до M)
      merges.push({
        s: { r: currentRow, c: 0 },     // start: строка currentRow, колонка A (0)
        e: { r: currentRow, c: 13 }     // end: строка currentRow, колонка M (13)
      })
      
      // Применяем стили к ячейке с названием класса
      const classNameCell = XLSX.utils.encode_cell({ r: currentRow, c: 0 })
      if (studentSheet[classNameCell]) {
        studentSheet[classNameCell].s = {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: 'center', vertical: 'center' }
        }
      }
      
      // Применяем жирный шрифт для заголовков дней недели (строка currentRow + 1)
      const daysHeaderRow = currentRow + 1
      const dayColumns = [1, 3, 5, 7, 9, 11] // Колонки с днями недели
      dayColumns.forEach(col => {
        const dayCell = XLSX.utils.encode_cell({ r: daysHeaderRow, c: col })
        if (studentSheet[dayCell]) {
          studentSheet[dayCell].s = {
            font: { bold: true, sz: 12 },
            alignment: { horizontal: 'center', vertical: 'center' }
          }
        }
      })
      
      // Применяем жирный шрифт для подзаголовков "Предмет" и "Каб." (строка currentRow + 2)
      const subHeaderRow = currentRow + 2
      for (let col = 1; col <= 12; col += 2) {
        // Предмет
        const subjectCell = XLSX.utils.encode_cell({ r: subHeaderRow, c: col })
        if (studentSheet[subjectCell]) {
          studentSheet[subjectCell].s = {
            font: { bold: true, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center' }
          }
        }
        // Каб.
        const roomCell = XLSX.utils.encode_cell({ r: subHeaderRow, c: col + 1 })
        if (studentSheet[roomCell]) {
          studentSheet[roomCell].s = {
            font: { bold: true, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center' }
          }
        }
      }
      
      // Считаем строки для следующего класса: название + заголовки + подзаголовки + разделитель + уроки + разделительная линия
      currentRow += 1 + 1 + 1 + 1 + maxLessons // название + заголовки + подзаголовки + разделитель + уроки
      
      // Если это не последний класс, добавляем разделительную линию
      if (classIndex < Object.entries(scheduleByClass).length - 1) {
        // Объединяем ячейки для разделительной линии (от колонки A до M)
        merges.push({
          s: { r: currentRow + 1, c: 0 },     // start: строка с разделительной линией, колонка A (0)
          e: { r: currentRow + 1, c: 13 }     // end: строка с разделительной линией, колонка M (13)
        })
        
        // Применяем стили к разделительной линии
        const separatorCell = XLSX.utils.encode_cell({ r: currentRow + 1, c: 0 })
        if (studentSheet[separatorCell]) {
          studentSheet[separatorCell].s = {
            font: { bold: true, sz: 12 },
            alignment: { horizontal: 'center', vertical: 'center' }
          }
        }
        
        currentRow += 3 // пустая строка + разделительная линия + пустая строка
      }
    })
    
    // Применяем объединение ячеек
    if (merges.length > 0) {
      studentSheet['!merges'] = merges
    }
    
    // Дополнительно устанавливаем диапазон для объединения ячеек
    if (merges.length > 0) {
      studentSheet['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: studentData.length - 1, c: 13 }
      })
    }

    // ===== ЛИСТ 2: РАСПИСАНИЕ ДЛЯ УЧИТЕЛЕЙ =====
    const teacherData: (string | number)[][] = []
    
    // Заголовок
    teacherData.push(['Расписание уроков для учителей', '', '', '', '', '', '', '', '', '', '', '', '', ''])
    teacherData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', ''])

    // Группируем расписание по учителям
    const scheduleByTeacher = generationResult.teacherSchedule.reduce((acc, lesson) => {
      if (!acc[lesson.teacherName]) acc[lesson.teacherName] = {}
      if (!acc[lesson.teacherName][lesson.day]) acc[lesson.teacherName][lesson.day] = {}
      acc[lesson.teacherName][lesson.day][lesson.lessonNumber] = lesson
      return acc
    }, {} as {[teacherName: string]: {[day: string]: {[lessonNumber: number]: TeacherSchedule}}})

    Object.entries(scheduleByTeacher).forEach(([teacherName, teacherSchedule], teacherIndex) => {
      if (teacherIndex > 0) {
        // Добавляем пустую строку между учителями
        teacherData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      }
      
      // ФИО учителя - только первая ячейка содержит название, остальные пустые для объединения
      teacherData.push([`Учитель - ${teacherName}`, '', '', '', '', '', '', '', '', '', '', '', '', ''])
      teacherData.push(['01.09.2025 - 07.09.2025', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      
      // Заголовки колонок с разделителями
      teacherData.push([
        '№', 'Понедельник', '', 'Вторник', '', 'Среда', '', 'Четверг', '', 'Пятница', '', 'Суббота', '', ''
      ])
      teacherData.push([
        '', 'Предмет', 'Каб.', 'Предмет', 'Каб.', 'Предмет', 'Каб.', 'Предмет', 'Каб.', 'Предмет', 'Каб.', 'Предмет', 'Каб.', ''
      ])
      // Разделительная линия
      teacherData.push([
        '═══', '═══════════════', '════', '═══════════════', '════', '═══════════════', '════', '═══════════════', '════', '═══════════════', '════', '═══════════════', '════', ''
      ])

      // Строки с уроками
      for (let lessonNumber = 1; lessonNumber <= maxLessons; lessonNumber++) {
        const row: (string | number)[] = [lessonNumber]
        
        days.forEach(day => {
          const lesson = teacherSchedule[day]?.[lessonNumber]
          if (lesson) {
            // Находим кабинет из расписания учеников
            const studentLesson = generationResult.studentSchedule.find(s => 
              s.day === lesson.day && 
              s.lessonNumber === lesson.lessonNumber && 
              s.subjectName === lesson.subjectName &&
              s.className === lesson.className
            )
            row.push(lesson.subjectName, studentLesson?.classroomName || '-')
          } else {
            row.push('—', '—')
          }
        })
        row.push('') // Последний столбец пустой
        
        teacherData.push(row)
      }
    })

    const teacherSheet = XLSX.utils.aoa_to_sheet(teacherData)
    
    // Настройка ширины колонок для листа учителей
    teacherSheet['!cols'] = [
      { wch: 6 },  // № (вернули обратно к 6)
      { wch: 20 }, // Понедельник предмет
      { wch: 8 },  // Понедельник каб
      { wch: 20 }, // Вторник предмет
      { wch: 8 },  // Вторник каб
      { wch: 20 }, // Среда предмет
      { wch: 8 },  // Среда каб
      { wch: 20 }, // Четверг предмет
      { wch: 8 },  // Четверг каб
      { wch: 20 }, // Пятница предмет
      { wch: 8 },  // Пятница каб
      { wch: 20 }, // Суббота предмет
      { wch: 8 },  // Суббота каб
      { wch: 8 }   // Пустой столбец
    ]

    // Объединяем ячейки для названий учителей
    const teacherMerges: any[] = []
    let teacherCurrentRow = 0
    
    Object.entries(scheduleByTeacher).forEach(([teacherName, teacherSchedule], teacherIndex) => {
      if (teacherIndex > 0) {
        teacherCurrentRow++ // Пропускаем пустую строку между учителями
      }
      
      // Объединяем ячейки для названия учителя (от колонки A до M)
      teacherMerges.push({
        s: { r: teacherCurrentRow, c: 0 },     // start: строка teacherCurrentRow, колонка A (0)
        e: { r: teacherCurrentRow, c: 13 }     // end: строка teacherCurrentRow, колонка M (13)
      })
      
      // Применяем стили к ячейке с названием учителя
      const teacherNameCell = XLSX.utils.encode_cell({ r: teacherCurrentRow, c: 0 })
      if (teacherSheet[teacherNameCell]) {
        teacherSheet[teacherNameCell].s = {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: 'center', vertical: 'center' }
        }
      }
      
      // Применяем жирный шрифт для заголовков дней недели (строка teacherCurrentRow + 1)
      const teacherDaysHeaderRow = teacherCurrentRow + 1
      const dayColumns = [1, 3, 5, 7, 9, 11] // Колонки с днями недели
      dayColumns.forEach(col => {
        const dayCell = XLSX.utils.encode_cell({ r: teacherDaysHeaderRow, c: col })
        if (teacherSheet[dayCell]) {
          teacherSheet[dayCell].s = {
            font: { bold: true, sz: 12 },
            alignment: { horizontal: 'center', vertical: 'center' }
          }
        }
      })
      
      // Применяем жирный шрифт для подзаголовков "Предмет" и "Класс" (строка teacherCurrentRow + 2)
      const teacherSubHeaderRow = teacherCurrentRow + 2
      for (let col = 1; col <= 12; col += 2) {
        // Предмет
        const subjectCell = XLSX.utils.encode_cell({ r: teacherSubHeaderRow, c: col })
        if (teacherSheet[subjectCell]) {
          teacherSheet[subjectCell].s = {
            font: { bold: true, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center' }
          }
        }
        // Класс
        const classCell = XLSX.utils.encode_cell({ r: teacherSubHeaderRow, c: col + 1 })
        if (teacherSheet[classCell]) {
          teacherSheet[classCell].s = {
            font: { bold: true, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center' }
          }
        }
      }
      
      // Считаем строки для следующего учителя: название + дата + заголовки + подзаголовки + разделитель + уроки
      teacherCurrentRow += 1 + 1 + 1 + 1 + 1 + maxLessons // название + дата + заголовки + подзаголовки + разделитель + уроки
    })
    
    // Применяем объединение ячеек
    if (teacherMerges.length > 0) {
      teacherSheet['!merges'] = teacherMerges
    }

    // Добавляем листы в книгу
    XLSX.utils.book_append_sheet(workbook, studentSheet, 'Расписание по классам')
    XLSX.utils.book_append_sheet(workbook, teacherSheet, 'Расписание учителей')

    // Генерируем имя файла с текущей датой
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '.')
    const fileName = `Расписание_${dateStr}.xlsx`

    // Скачиваем файл
    XLSX.writeFile(workbook, fileName)
  }


  const renderStudentSchedule = () => {
    if (!generationResult?.studentSchedule.length) return null

    // Группируем по классам
    const scheduleByClass = generationResult.studentSchedule.reduce((acc, lesson) => {
      if (!acc[lesson.className]) acc[lesson.className] = {}
      if (!acc[lesson.className][lesson.day]) acc[lesson.className][lesson.day] = {}
      acc[lesson.className][lesson.day][lesson.lessonNumber] = lesson
      return acc
    }, {} as {[className: string]: {[day: string]: {[lessonNumber: number]: StudentSchedule}}})

    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    const maxLessons = 8

    return (
      <div className="space-y-8">
        {Object.entries(scheduleByClass).map(([className, classSchedule]) => (
          <div key={className} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Класс - {className}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center w-16">
                      №
                    </th>
                    {days.map(day => (
                      <th key={day} className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center min-w-32">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxLessons }, (_, lessonIndex) => {
                    const lessonNumber = lessonIndex + 1
                    return (
                      <tr key={lessonNumber} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-3 text-sm font-medium text-gray-900 text-center bg-gray-50">
                          {lessonNumber}
                        </td>
                        {days.map(day => {
                          const lesson = classSchedule[day]?.[lessonNumber]
                          return (
                            <td key={`${day}-${lessonNumber}`} className="border border-gray-300 px-2 py-3 text-xs text-center">
                              {lesson ? (
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-900">{lesson.subjectName}</div>
                                  <div className="text-gray-500">{lesson.classroomName}</div>
                                </div>
                              ) : (
                                <div className="text-gray-400">-</div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderTeacherSchedule = () => {
    if (!generationResult?.teacherSchedule.length) return null

    const scheduleByTeacher = generationResult.teacherSchedule.reduce((acc, lesson) => {
      if (!acc[lesson.teacherName]) acc[lesson.teacherName] = {}
      if (!acc[lesson.teacherName][lesson.day]) acc[lesson.teacherName][lesson.day] = {}
      acc[lesson.teacherName][lesson.day][lesson.lessonNumber] = lesson
      return acc
    }, {} as {[teacherName: string]: {[day: string]: {[lessonNumber: number]: TeacherSchedule}}})

    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    const maxLessons = 8

    return (
      <div className="space-y-8">
        {Object.entries(scheduleByTeacher).map(([teacherName, teacherSchedule]) => (
          <div key={teacherName} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{teacherName}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center w-16">
                      №
                    </th>
                    {days.map(day => (
                      <th key={day} className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center min-w-32">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxLessons }, (_, lessonIndex) => {
                    const lessonNumber = lessonIndex + 1
                    return (
                      <tr key={lessonNumber} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-3 text-sm font-medium text-gray-900 text-center bg-gray-50">
                          {lessonNumber}
                        </td>
                        {days.map(day => {
                          const lesson = teacherSchedule[day]?.[lessonNumber]
                          return (
                            <td key={`${day}-${lessonNumber}`} className="border border-gray-300 px-2 py-3 text-xs text-center">
                              {lesson ? (
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-900">{lesson.subjectName}</div>
                                  <div className="text-gray-500">{lesson.className}</div>
                                </div>
                              ) : (
                                <div className="text-gray-400">-</div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Просмотр и генерация расписания
        </h2>
        <p className="text-gray-600">
          Сгенерируйте расписание с учетом всех ограничений и экспортируйте в Excel
        </p>
      </div>

      {/* Настройки ограничений */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Настройки ограничений
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Жесткие ограничения */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Жесткие ограничения (обязательные)</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={constraints.resourceUniqueness}
                  disabled
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Ресурсная уникальность</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={constraints.teacherAvailability}
                  disabled
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Доступность учителей</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={constraints.loadFulfillment}
                  disabled
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Выполнение нагрузок</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={constraints.elementaryRules}
                  disabled
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Правила начальной школы</span>
              </label>
            </div>
          </div>
          
          {/* Мягкие ограничения */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Мягкие ограничения (желательные)</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Минимизировать окна</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={constraints.minimizeGaps.enabled}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      minimizeGaps: { ...prev.minimizeGaps, enabled: e.target.checked }
                    }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={constraints.minimizeGaps.weight}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      minimizeGaps: { ...prev.minimizeGaps, weight: parseInt(e.target.value) }
                    }))}
                    className="w-16"
                  />
                  <span className="text-xs text-gray-500 w-6">{constraints.minimizeGaps.weight}</span>
                </div>
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Избегать крайних слотов</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={constraints.avoidExtremeSlots.enabled}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      avoidExtremeSlots: { ...prev.avoidExtremeSlots, enabled: e.target.checked }
                    }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={constraints.avoidExtremeSlots.weight}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      avoidExtremeSlots: { ...prev.avoidExtremeSlots, weight: parseInt(e.target.value) }
                    }))}
                    className="w-16"
                  />
                  <span className="text-xs text-gray-500 w-6">{constraints.avoidExtremeSlots.weight}</span>
                </div>
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Равномерно распределять сложные предметы</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={constraints.distributeDifficultSubjects.enabled}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      distributeDifficultSubjects: { ...prev.distributeDifficultSubjects, enabled: e.target.checked }
                    }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={constraints.distributeDifficultSubjects.weight}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      distributeDifficultSubjects: { ...prev.distributeDifficultSubjects, weight: parseInt(e.target.value) }
                    }))}
                    className="w-16"
                  />
                  <span className="text-xs text-gray-500 w-6">{constraints.distributeDifficultSubjects.weight}</span>
                </div>
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Предпочитать закрепленные кабинеты</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={constraints.preferAssignedClassrooms.enabled}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      preferAssignedClassrooms: { ...prev.preferAssignedClassrooms, enabled: e.target.checked }
                    }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={constraints.preferAssignedClassrooms.weight}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      preferAssignedClassrooms: { ...prev.preferAssignedClassrooms, weight: parseInt(e.target.value) }
                    }))}
                    className="w-16"
                  />
                  <span className="text-xs text-gray-500 w-6">{constraints.preferAssignedClassrooms.weight}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка генерации */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Генерация расписания
            </h3>
            <p className="text-gray-600">
              Нажмите кнопку для создания расписания с учетом всех настроек
            </p>
            {isGenerating && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Прогресс: {generationProgress}%</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isGenerating ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              <span>{isGenerating ? 'Генерация...' : 'Сгенерировать расписание'}</span>
            </button>
            
          </div>
        </div>
      </div>

      {/* Результаты генерации */}
      {generationResult && (
        <div className="space-y-6">
          {/* Кнопки действий */}
          {generationResult.success && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Действия с расписанием
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={exportToExcel}
                  className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Экспорт в Excel</span>
                </button>
                
                <button
                  onClick={handleCheckSanPin}
                  disabled={isCheckingSanPin}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isCheckingSanPin
                      ? 'bg-blue-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isCheckingSanPin ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  <span>{isCheckingSanPin ? 'Проверка...' : 'Проверить СанПиН'}</span>
                </button>
              </div>
            </div>
          )}
          {/* Конфликты */}
          {generationResult.conflicts.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <button
                onClick={() => setIsConflictsExpanded(!isConflictsExpanded)}
                className="w-full flex items-center justify-between text-left hover:bg-yellow-50 rounded-lg p-3 -m-3 transition-all duration-200 border border-transparent hover:border-yellow-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                  Обнаружены проблемы при генерации расписания
                  <span className="ml-2 px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                    {generationResult.conflicts.length} {generationResult.conflicts.length === 1 ? 'проблема' : 'проблем'}
                  </span>
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-yellow-600 font-medium">
                    {isConflictsExpanded ? 'Свернуть' : 'Развернуть'}
                  </span>
                  {isConflictsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
              </button>
              
              {isConflictsExpanded && (
                <div className="mt-4 space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Рекомендации для решения проблем:</strong>
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc space-y-1">
                      <li>Увеличьте количество доступных кабинетов</li>
                      <li>Проверьте блокеры учителей - возможно, они слишком ограничивают расписание</li>
                      <li>Рассмотрите возможность добавления дополнительных учителей по предметам</li>
                      <li>Уменьшите нагрузки по предметам для проблемных классов</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    {generationResult.conflicts.map((conflict, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-l-4 ${
                          conflict.severity === 'error' 
                            ? 'bg-red-50 text-red-800 border-red-400'
                            : 'bg-yellow-50 text-yellow-800 border-yellow-400'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {conflict.severity === 'error' ? (
                            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium whitespace-pre-line">
                              {conflict.message}
                            </div>
                            
                            {/* Детали конфликта */}
                            {conflict.details && (
                              <div className="mt-2 text-xs text-gray-600">
                                <strong>Детали:</strong> {conflict.details}
                              </div>
                            )}
                            
                            {/* Рекомендации */}
                            {conflict.recommendation && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700 border border-blue-200">
                                💡 <strong>Рекомендация:</strong> {conflict.recommendation}
                              </div>
                            )}
                            
                            {/* Дополнительная информация */}
                            {(conflict.className || conflict.teacherName || conflict.subjectName || conflict.day) && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {conflict.className && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    Класс: {conflict.className}
                                  </span>
                                )}
                                {conflict.teacherName && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    Учитель: {conflict.teacherName}
                                  </span>
                                )}
                                {conflict.subjectName && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    Предмет: {conflict.subjectName}
                                  </span>
                                )}
                                {conflict.day && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    День: {conflict.day}
                                  </span>
                                )}
                                {conflict.lesson && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    Урок: {conflict.lesson}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Общие советы по типу конфликта */}
                            {!conflict.recommendation && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                {conflict.type === 'load' && (
                                  <>💡 <strong>Совет:</strong> Попробуйте уменьшить нагрузки по предметам, добавить больше кабинетов или изменить блокеры учителей</>
                                )}
                                {conflict.type === 'teacher' && (
                                  <>💡 <strong>Совет:</strong> Проверьте блокеры учителей или добавьте больше учителей для предметов</>
                                )}
                                {conflict.type === 'classroom' && (
                                  <>💡 <strong>Совет:</strong> Добавьте больше кабинетов или проверьте совместимость предметов с кабинетами</>
                                )}
                                {conflict.type === 'elementary' && (
                                  <>💡 <strong>Совет:</strong> Убедитесь, что для начальных классов назначен классный руководитель</>
                                )}
                                {conflict.type === 'resource_conflict' && (
                                  <>💡 <strong>Совет:</strong> Проверьте, что ресурсы (учителя, кабинеты, классы) не перегружены</>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Проверка СанПиН */}
          {sanPinViolations.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <button
                onClick={() => setIsSanPinExpanded(!isSanPinExpanded)}
                className="w-full flex items-center justify-between text-left hover:bg-blue-50 rounded-lg p-3 -m-3 transition-all duration-200 border border-transparent hover:border-blue-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                  Проверка соответствия СанПиН
                  <span className="ml-2 px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                    {sanPinViolations.length} {sanPinViolations.length === 1 ? 'нарушение' : 'нарушений'}
                  </span>
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-blue-600 font-medium">
                    {isSanPinExpanded ? 'Свернуть' : 'Развернуть'}
                  </span>
                  {isSanPinExpanded ? (
                    <ChevronUp className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </button>
              
              {isSanPinExpanded && (
                <div className="mt-4 space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>СанПиН 2.4.3648-20</strong> - Санитарно-эпидемиологические требования к организациям воспитания и обучения, отдыха и оздоровления детей и молодежи
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {sanPinViolations.map((violation, index) => (
                      <div key={index} className={`p-4 rounded-lg border-l-4 ${
                        violation.severity === 'error' 
                          ? 'bg-red-50 border-red-400' 
                          : 'bg-yellow-50 border-yellow-400'
                      }`}>
                        <div className="flex items-start space-x-3">
                          {violation.severity === 'error' ? (
                            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {violation.message}
                            </div>
                            {violation.className && (
                              <div className="text-xs text-gray-600 mt-1">
                                <strong>Класс:</strong> {violation.className}
                                {violation.day && <span> • <strong>День:</strong> {violation.day}</span>}
                              </div>
                            )}
                            {violation.details && (
                              <div className="text-xs text-gray-600 mt-1">
                                <strong>Детали:</strong> {violation.details}
                              </div>
                            )}
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                              💡 <strong>Рекомендация:</strong> {
                                violation.type === 'max_lessons' ? 'Уменьшите количество уроков в день для данного класса'
                                : violation.type === 'difficult_subjects' ? 'Переместите сложные предметы в первую половину дня'
                                : violation.type === 'consecutive_difficult' ? 'Разместите между сложными предметами предметы средней или легкой сложности'
                                : violation.type === 'physical_education' ? 'Переместите физкультуру на 2-3 урок или добавьте больше уроков физкультуры в неделю'
                                : violation.type === 'control_works' ? 'Перенесите контрольные работы на середину недели (вторник-четверг)'
                                : 'Обратите внимание на данное нарушение'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Успешная генерация */}
          {generationResult.success && (
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Вкладки */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'students'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Расписание для учеников</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('teachers')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'teachers'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Расписание для учителей</span>
                    </div>
                  </button>
                </nav>
              </div>

              {/* Содержимое вкладок */}
              <div className="p-6">
                {activeTab === 'students' ? renderStudentSchedule() : renderTeacherSchedule()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Пустое состояние */}
      {!generationResult && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Расписание не сгенерировано
          </h3>
          <p className="text-gray-600">
            Нажмите кнопку "Сгенерировать расписание" для создания расписания
          </p>
        </div>
      )}
    </div>
  )
}