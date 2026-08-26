import React from 'react'
import type { LoginFormData, LoginFormErrors } from '../../types/login.types'
import { InputField } from './InputField'
import { PrimaryButton } from './PrimaryButton'

interface LoginFormProps {
  formData: LoginFormData
  errors: LoginFormErrors
  loading: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
  onNavigateToRegister: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({
  formData,
  errors,
  loading,
  onChange,
  onSubmit,
  onNavigateToRegister,
}) => {
  return (
    <div className="w-full max-w-lg rounded-2xl bg-white p-10 shadow-xl ring-1 ring-neutral-100">
      <h2 className="text-center text-3xl font-bold text-neutral-800">Iniciar Sesión</h2>
      <p className="mt-2 text-center text-sm text-neutral-500">
        Ingresa tus credenciales para continuar
      </p>

      {errors.general && (
        <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
          {errors.general}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-6">
        <InputField
          id="correo"
          label="Correo Institucional"
          type="email"
          value={formData.correo}
          onChange={onChange}
          placeholder="ejemplo@usac.edu.gt"
          error={errors.correo}
          disabled={loading}
          required
        />

        <InputField
          id="password"
          label="Contraseña"
          type="password"
          value={formData.password}
          onChange={onChange}
          placeholder="••••••••"
          error={errors.password}
          disabled={loading}
          required
        />

        <PrimaryButton type="submit" loading={loading} className="py-3">
          Ingresar
        </PrimaryButton>
      </form>

      <div className="mt-8 border-t border-neutral-100 pt-6 text-center text-sm text-neutral-500">
        ¿No tienes cuenta?{' '}
        <button type="button" onClick={onNavigateToRegister} className="font-semibold text-[#9E1FFF] hover:text-[#2E1FFF]">
          Regístrate
        </button>
      </div>
    </div>
  )
}