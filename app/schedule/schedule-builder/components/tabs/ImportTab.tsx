'use client'

import { useState, useEffect } from 'react'
import { Upload, FileSpreadsheet, Users, BookOpen, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useScheduleBuilder, Teacher, Subject } from '../../context/ScheduleBuilderContext'
import { TabType } from '../../page'
import * as XLSX from 'xlsx'

interface ImportTabProps {
  onUpdateStatus: (tabId: TabType, completed: boolean, hasErrors?: boolean) => void
}

interface ImportedData {
  teachers: Teacher[]
  subjects: Subject[]
  classrooms: any[]
  classes: any[]
}

export const ImportTab = ({ onUpdateStatus }: ImportTabProps) => {
  const { data, addTeacher, addSubject, updateTeachers, updateSubjects, updateClassrooms, updateClasses } = useScheduleBuilder()
  const [importedData, setImportedData] = useState<ImportedData | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    const hasData = data.teachers.length > 0 || data.subjects.length > 0
    onUpdateStatus('import', hasData, false)
  }, [data.teachers.length, data.subjects.length, onUpdateStatus])

  const parseTeacherName = (fullName: string) => {
    const parts = fullName.trim().split(' ')
    if (parts.length >= 2) {
      return {
        lastName: parts[0],
        firstName: parts[1],
        middleName: parts[2] || ''
      }
    }
    return {
      lastName: fullName,
      firstName: '',
      middleName: ''
    }
  }

  const parseSubjects = (subjectsString: string): string[] => {
    if (!subjectsString || subjectsString.trim() === '') return []
    
    // Удаляем числа в начале строки (например, "23 Алгебра, Геометрия" -> "Алгебра, Геометрия")
    const cleanedString = subjectsString.replace(/^\d+\s+/, '')
    
    // Разделяем по запятой и очищаем от лишних пробелов
    return cleanedString
      .split(',')
      .map(subject => subject.trim())
      .filter(subject => subject.length > 0)
      .map(subject => {
        // Удаляем возможные числа в начале каждого предмета
        return subject.replace(/^\d+\s+/, '').trim()
      })
      .filter(subject => subject.length > 0)
  }

  const parseClassrooms = (classroomsString: string): string[] => {
    if (!classroomsString || classroomsString.trim() === '') return []
    
    // Разделяем по запятой и очищаем от лишних пробелов
    return classroomsString
      .split(',')
      .map(classroom => classroom.trim())
      .filter(classroom => classroom.length > 0)
  }

  const extractClassNames = (subjects: string[]): string[] => {
    const classNames = new Set<string>()
    
    // Ищем классы в названиях предметов (например, "5А Математика", "6Б Русский язык")
    subjects.forEach(subject => {
      const match = subject.match(/^(\d+[А-Яа-я]?)\s+/)
      if (match) {
        classNames.add(match[1])
      }
    })
    
    // Классы создаются только на основе найденных в предметах
    
    return Array.from(classNames)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportError(null)
    setImportedData(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

      const teachers: Teacher[] = []
      const subjects: Subject[] = []
      const classrooms: any[] = []
      const classes: any[] = []
      const subjectSet = new Set<string>()
      const classroomSet = new Set<string>()
      const classSet = new Set<string>()
      const allSubjects: string[] = []

      // Пропускаем заголовок, начинаем с индекса 1
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as string[]
        if (!row || row.length === 0) continue

        const fullName = row[0]?.toString().trim()
        const classroomName = row[1]?.toString().trim() || ''
        const subjectsString = row[2]?.toString().trim() || ''

        if (fullName) {
          const { lastName, firstName, middleName } = parseTeacherName(fullName)
          const teacherSubjects = parseSubjects(subjectsString)
          const teacherClassrooms = parseClassrooms(classroomName)
          
          // Добавляем предметы в общий список
          teacherSubjects.forEach(subject => {
            if (subject && !subjectSet.has(subject)) {
              subjectSet.add(subject)
              allSubjects.push(subject)
              subjects.push({
                id: `subject_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: subject,
                difficulty: 'easy',
                isGrouped: false
              })
            }
          })

          // Добавляем кабинеты в общий список
          teacherClassrooms.forEach(classroom => {
            if (classroom && !classroomSet.has(classroom)) {
              classroomSet.add(classroom)
              classrooms.push({
                id: `classroom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: classroom,
                type: 'regular',
                capacity: 30,
                subject: 'Общий'
              })
            }
          })

          // Создаем учителя с предметами
          const teacher: Teacher = {
            id: `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            firstName,
            lastName,
            middleName,
            subjects: teacherSubjects.map(subject => {
              const subjectObj = subjects.find(s => s.name === subject)
              return subjectObj?.id || ''
            }).filter(id => id !== ''),
            blockers: {
              monday: [],
              tuesday: [],
              wednesday: [],
              thursday: [],
              friday: [],
              saturday: []
            }
          }

          teachers.push(teacher)
        }
      }

      // Создаем классы на основе найденных предметов
      const classNames = extractClassNames(allSubjects)
      classNames.forEach(className => {
        if (!classSet.has(className)) {
          classSet.add(className)
          classes.push({
            id: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: className,
            subjects: {} // Пустой объект, пользователь сможет добавить предметы позже
          })
        }
      })

      setImportedData({ teachers, subjects, classrooms, classes })
    } catch (error) {
      console.error('Ошибка при импорте файла:', error)
      setImportError('Ошибка при чтении файла. Проверьте формат файла.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportData = () => {
    if (!importedData) return

    try {
      // Добавляем предметы
      const existingSubjects = [...data.subjects]
      const newSubjects = importedData.subjects.filter(subject => 
        !existingSubjects.some(existing => existing.name === subject.name)
      )
      
      if (newSubjects.length > 0) {
        updateSubjects([...existingSubjects, ...newSubjects])
      }

      // Добавляем кабинеты
      const existingClassrooms = [...data.classrooms]
      const newClassrooms = importedData.classrooms.filter(classroom => 
        !existingClassrooms.some(existing => existing.name === classroom.name)
      )
      
      if (newClassrooms.length > 0) {
        updateClassrooms([...existingClassrooms, ...newClassrooms])
      }

      // Добавляем классы
      const existingClasses = [...data.classes]
      const newClasses = importedData.classes.filter(classItem => 
        !existingClasses.some(existing => existing.name === classItem.name)
      )
      
      if (newClasses.length > 0) {
        updateClasses([...existingClasses, ...newClasses])
      }

      // Добавляем учителей
      const existingTeachers = [...data.teachers]
      const newTeachers = importedData.teachers.map(teacher => ({
        ...teacher,
        subjects: teacher.subjects.map(subjectId => {
          const subject = [...existingSubjects, ...newSubjects].find(s => s.id === subjectId)
          return subject?.id || ''
        }).filter(id => id !== '')
      }))
      
      updateTeachers([...existingTeachers, ...newTeachers])

      // Очищаем импортированные данные
      setImportedData(null)
      
      // Показываем уведомление об успехе
      alert(`Успешно импортировано:\n- ${newSubjects.length} предметов (сложность: легко)\n- ${newClassrooms.length} кабинетов\n- ${newClasses.length} классов (только из предметов)\n- ${newTeachers.length} учителей\n\n⚠️ ВАЖНО:\n1. Отредактируйте сложность предметов во вкладке "Предметы"\n2. Создайте дополнительные классы и добавьте учебную нагрузку во вкладке "Классы и нагрузки"`)
    } catch (error) {
      console.error('Ошибка при импорте данных:', error)
      setImportError('Ошибка при импорте данных')
    }
  }

  const handleClearData = () => {
    setImportedData(null)
    setImportError(null)
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и инструкции */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Upload className="w-8 h-8 mr-3 text-green-600" />
            Импорт данных из Excel
          </h2>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            📋 Инструкция по заполнению Excel файла
          </h3>
          <div className="text-sm text-blue-800 space-y-3">
            <div>
              <p className="font-semibold mb-2">Формат файла:</p>
              <p>Поддерживаются форматы .xlsx и .xls</p>
            </div>
            
            <div>
              <p className="font-semibold mb-2">Структура таблицы:</p>
              <ul className="ml-4 space-y-1">
                <li>• <strong>Столбец A:</strong> ФИО учителя (например: "Александрова Юлия Валерьевна")</li>
                <li>• <strong>Столбец B:</strong> Номера кабинетов через запятую (например: "101, 102, Актовый зал")</li>
                <li>• <strong>Столбец C:</strong> Названия предметов через запятую (например: "Алгебра, Геометрия, Математика")</li>
              </ul>
            </div>
            
            <div>
              <p className="font-semibold mb-2">Пример заполнения:</p>
              <div className="bg-white p-3 rounded border text-xs font-mono">
                A1: Александрова Юлия Валерьевна | B1: 101, 102 | C1: Алгебра, Геометрия, Математика<br/>
                A2: Андросенко Екатерина Валерьевна | B2: 103, Актовый зал | C2: Музыка, Разговоры о важном<br/>
                A3: Бочкарева Алла Григорьевна | B3: м/зал, б/зал 1, б/зал 2 | C3: Русский язык, Математика, Литературное чтение
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-yellow-800 text-xs">
              💡 <strong>Важно:</strong> Система автоматически разделит ФИО на фамилию, имя и отчество, создаст кабинеты и извлечет все предметы из столбца C. Все предметы будут созданы с базовой сложностью "Легко" - не забудьте отредактировать их во вкладке "Предметы" и создать классы с учебной нагрузкой во вкладке "Классы и нагрузки"!
            </p>
            </div>
          </div>
        </div>

        {/* Загрузка файла */}
        <div className="text-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="import-file"
            disabled={isImporting}
          />
          <label
            htmlFor="import-file"
            className={`inline-flex items-center space-x-3 px-8 py-4 rounded-lg transition-colors cursor-pointer text-lg font-medium shadow-lg hover:shadow-xl ${
              isImporting 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isImporting ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Загрузка...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span>Загрузить Excel</span>
              </>
            )}
          </label>
          <p className="text-sm text-gray-500 mt-3">
            Нажмите для выбора Excel файла с данными учителей и предметов
          </p>
        </div>

        {importError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{importError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Предварительный просмотр импортированных данных */}
      {importedData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-green-600" />
              Предварительный просмотр
            </h3>
            <button
              onClick={handleClearData}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Предметы */}
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Предметы ({importedData.subjects.length})
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {importedData.subjects.map((subject, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm text-gray-700">{subject.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Кабинеты */}
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Кабинеты ({importedData.classrooms.length})
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {importedData.classrooms.map((classroom, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm text-gray-700">{classroom.name}</span>
                  </div>
                ))}
              </div>
            </div>


            {/* Учителя */}
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Учителя ({importedData.teachers.length})
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {importedData.teachers.map((teacher, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <div className="flex items-center mb-1">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {teacher.lastName} {teacher.firstName} {teacher.middleName}
                      </span>
                    </div>
                    {teacher.subjects.length > 0 && (
                      <div className="ml-6">
                        <p className="text-xs text-gray-500">
                          Предметы: {teacher.subjects.length}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={handleClearData}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleImportData}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Импортировать данные
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
