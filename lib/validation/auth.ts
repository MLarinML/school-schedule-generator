import { z } from 'zod'

// Схема для регистрации
export const registerSchema = z.object({
  email: z
    .string()
    .email('Введите корректный email адрес')
    .min(1, 'Email обязателен')
    .max(255, 'Email слишком длинный')
    .transform(email => email.toLowerCase().trim()),
  password: z
    .string()
    .min(10, 'Пароль должен содержать не менее 10 символов')
    .max(128, 'Пароль слишком длинный'),
  firstName: z
    .string()
    .min(1, 'Имя обязательно')
    .max(50, 'Имя слишком длинное'),
  lastName: z
    .string()
    .min(1, 'Фамилия обязательна')
    .max(50, 'Фамилия слишком длинная')
})

// Схема для входа
export const loginSchema = z.object({
  email: z
    .string()
    .email('Введите корректный email адрес')
    .min(1, 'Email обязателен')
    .transform(email => email.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Пароль обязателен'),
  rememberMe: z
    .boolean()
    .optional()
})

// Схема для сброса пароля
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .email('Введите корректный email адрес')
    .min(1, 'Email обязателен')
    .transform(email => email.toLowerCase().trim())
})

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Токен обязателен'),
  password: z
    .string()
    .min(10, 'Пароль должен содержать не менее 10 символов')
    .max(128, 'Пароль слишком длинный'),
  confirmPassword: z
    .string()
    .min(1, 'Подтвердите пароль')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword']
})

// Схема для верификации email
export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, 'Токен обязателен')
})

// Схема для изменения пароля
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Текущий пароль обязателен'),
  newPassword: z
    .string()
    .min(10, 'Новый пароль должен содержать не менее 10 символов')
    .max(128, 'Новый пароль слишком длинный'),
  confirmNewPassword: z
    .string()
    .min(1, 'Подтвердите новый пароль')
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Новые пароли не совпадают',
  path: ['confirmNewPassword']
})

// Схема для обновления профиля
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Имя обязательно')
    .max(100, 'Имя слишком длинное')
    .optional(),
  locale: z
    .enum(['ru', 'en'])
    .default('ru'),
  timezone: z
    .string()
    .default('Europe/Moscow')
})

// Типы для использования в компонентах
export type RegisterFormData = z.infer<typeof registerSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type RequestPasswordResetFormData = z.infer<typeof requestPasswordResetSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
