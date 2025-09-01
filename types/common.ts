export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: SelectOption[]
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    message?: string
  }
}

