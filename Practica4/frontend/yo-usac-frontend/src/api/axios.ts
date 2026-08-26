import axios, { AxiosError, type AxiosInstance } from 'axios'
import type { ApiErrorResponse } from '../types/api.types'
import { clearSession } from '../store/session.store'

const DEFAULT_API_URL = 'http://localhost:4000'

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? DEFAULT_API_URL

export function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  })

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
      if (error.response?.status === 401) {
        clearSession()
      }
      return Promise.reject(error)
    }
  )

  return instance
}

export const api: AxiosInstance = createApiClient()

export function extraerMensajeError(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.mensaje ?? 'Error interno del servidor'
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Error interno del servidor'
}
