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
  type: 'teacher' | 'classroom' | 'load'
  message: string
  severity: 'error' | 'warning'
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
    
    // Генерация расписания
    try {
      const { studentSchedule, teacherSchedule, conflicts } = generateSchedule()
      
      setGenerationResult({
        success: true,
        conflicts,
        studentSchedule,
        teacherSchedule
      })
    } catch (error) {
      setGenerationResult({
        success: false,
        conflicts: [{
          type: 'load',
          message: 'Ошибка при генерации расписания',
          severity: 'error'
        }],
        studentSchedule: [],
        teacherSchedule: []
      })
    }
    
    setIsGenerating(false)
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
                            {conflict.type === 'load' && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                💡 <strong>Совет:</strong> Попробуйте уменьшить нагрузки по предметам, добавить больше кабинетов или изменить блокеры учителей
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