import React from 'react'
import type { RegisterFormData, RegisterFormErrors } from '../../types/registro.types'
import { InputField } from './InputField'
import { SelectField } from './SelectField'
import { PrimaryButton } from './PrimaryButton'

interface RegisterFormProps {
  formData: RegisterFormData
  errors: RegisterFormErrors
  loading: boolean
  carreraOptions: { label: string; value: string | number }[]
  carrerasError?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onSubmit: (e: React.FormEvent) => void
  onNavigateToLogin: () => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  formData,
  errors,
  loading,
  carreraOptions,
  carrerasError,
  onChange,
  onSubmit,
  onNavigateToLogin,
}) => {
  return (
    <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl ring-1 ring-neutral-100">
      <h2 className="text-center text-2xl font-bold text-neutral-800">Crear Cuenta</h2>
      <p className="mt-1 text-center text-sm text-neutral-500">
        Completa tus datos para registrarte
      </p>

      {errors.general && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-600">
          {errors.general}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <InputField
            id="nombre"
            label="Nombre"
            type="text"
            value={formData.nombre}
            onChange={onChange}
            placeholder="Juan"
            error={errors.nombre}
            disabled={loading}
            required
          />

          <InputField
            id="apellido"
            label="Apellido"
            type="text"
            value={formData.apellido}
            onChange={onChange}
            placeholder="Pérez"
            error={errors.apellido}
            disabled={loading}
            required
          />

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

          <InputField
            id="dpi"
            label="DPI"
            type="text"
            value={formData.dpi}
            onChange={onChange}
            placeholder="1234567890101"
            error={errors.dpi}
            disabled={loading}
            required
          />

          <InputField
            id="fechaNacimiento"
            label="Fecha de Nacimiento"
            type="date"
            value={formData.fechaNacimiento}
            onChange={onChange}
            error={errors.fechaNacimiento}
            disabled={loading}
            required
          />

          <InputField
            id="carnet"
            label="Carnet / Registro Académico"
            type="text"
            value={formData.carnet}
            onChange={onChange}
            placeholder="202010044"
            error={errors.carnet}
            disabled={loading}
            required
          />

          <InputField
            id="telefono"
            label="Teléfono"
            type="tel"
            value={formData.telefono}
            onChange={onChange}
            placeholder="55555555"
            error={errors.telefono}
            disabled={loading}
            required
          />

          <SelectField
            id="carrera"
            label="Carrera"
            value={formData.carrera}
            onChange={onChange}
            options={carreraOptions}
            placeholder="Seleccionar carrera"
            error={errors.carrera}
            disabled={loading}
            required
          />
          {carrerasError && (
            <p role="alert" className="col-span-2 -mt-2 text-sm text-red-600">
              {carrerasError}
            </p>
          )}
        </div>

        <InputField
          id="direccion"
          label="Dirección"
          type="text"
          value={formData.direccion}
          onChange={onChange}
          placeholder="Ciudad de Guatemala, Zona 12"
          error={errors.direccion}
          disabled={loading}
          required
        />

        <PrimaryButton type="submit" loading={loading} className="mt-1">
          Registrarse
        </PrimaryButton>
      </form>

      <div className="mt-6 border-t border-neutral-100 pt-5 text-center text-sm text-neutral-500">
        ¿Ya tienes cuenta?{' '}
        <button type="button" onClick={onNavigateToLogin} className="font-semibold text-[#9E1FFF] hover:text-[#2E1FFF]">
          Iniciar Sesión
        </button>
      </div>
    </div>
  )
}