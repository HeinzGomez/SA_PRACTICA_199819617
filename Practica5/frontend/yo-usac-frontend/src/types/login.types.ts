export interface LoginFormData {
  correo: string
  password: string
}

export interface LoginFormErrors {
  correo?: string
  password?: string
  general?: string
}

export interface AuthState {
  loading: boolean
  error: string | null
  success: boolean
}
