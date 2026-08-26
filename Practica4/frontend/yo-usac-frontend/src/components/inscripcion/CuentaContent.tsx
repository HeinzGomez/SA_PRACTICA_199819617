import React from 'react'
import type {
  CuentaFormErrors,
  CuentaTab,
  PerfilFormState,
  SeguridadFormState,
} from '../../types/cuenta.types'
import { InputField } from '../autenticacion/InputField'
import { PrimaryButton } from '../autenticacion/PrimaryButton'

interface CuentaContentProps {
  activeTab: CuentaTab
  perfilData: PerfilFormState
  seguridadData: SeguridadFormState
  errors: CuentaFormErrors
  loading: boolean
  onChangePerfil: (e: React.ChangeEvent<HTMLInputElement>) => void
  onChangeSeguridad: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmitPerfil: (e: React.FormEvent) => void
  onSubmitSeguridad: (e: React.FormEvent) => void
}

export const CuentaContent: React.FC<CuentaContentProps> = ({
  activeTab,
  perfilData,
  seguridadData,
  errors,
  loading,
  onChangePerfil,
  onChangeSeguridad,
  onSubmitPerfil,
  onSubmitSeguridad,
}) => {
  if (activeTab === 'seguridad') {
    return (
      <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-bold text-neutral-900">Seguridad y Acceso</h2>

        {errors.general && (
          <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {errors.general}
          </div>
        )}

        <form onSubmit={onSubmitSeguridad} className="flex flex-col gap-4">
          <InputField
            id="passwordActual"
            label="Contraseña Actual"
            type="password"
            value={seguridadData.passwordActual}
            onChange={onChangeSeguridad}
            error={errors.passwordActual}
            placeholder="••••••••"
          />

          <InputField
            id="nuevaPassword"
            label="Nueva Contraseña"
            type="password"
            value={seguridadData.nuevaPassword}
            onChange={onChangeSeguridad}
            error={errors.nuevaPassword}
            placeholder="••••••••"
          />

          <InputField
            id="repetirPassword"
            label="Repetir Contraseña"
            type="password"
            value={seguridadData.repetirPassword}
            onChange={onChangeSeguridad}
            error={errors.repetirPassword}
            placeholder="••••••••"
          />

          <div className="flex justify-end">
            <PrimaryButton type="submit" loading={loading} className="w-auto px-6">
              Guardar Cambios
            </PrimaryButton>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-bold text-neutral-900">Información Personal</h2>

      {errors.general && (
        <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{errors.general}</div>
      )}

      <form onSubmit={onSubmitPerfil} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            id="nombre"
            label="Nombre"
            value={perfilData.nombre}
            onChange={onChangePerfil}
            disabled
          />

          <InputField
            id="apellido"
            label="Apellido"
            value={perfilData.apellido}
            onChange={onChangePerfil}
            disabled
          />

          <InputField
            id="correo"
            label="Correo Institucional"
            type="email"
            value={perfilData.correo}
            onChange={onChangePerfil}
            disabled
          />

          <InputField
            id="registroAcademico"
            label="Registro Académico / Carnet"
            value={perfilData.registroAcademico}
            onChange={onChangePerfil}
            error={errors.registroAcademico}
            disabled={loading}
          />

          <InputField
            id="dpi"
            label="DPI"
            value={perfilData.dpi}
            onChange={onChangePerfil}
            error={errors.dpi}
            disabled={loading}
          />

          <InputField
            id="fechaNacimiento"
            label="Fecha Nacimiento"
            type="date"
            value={perfilData.fechaNacimiento}
            onChange={onChangePerfil}
            error={errors.fechaNacimiento}
            disabled={loading}
          />

          <InputField
            id="telefono"
            label="Teléfono"
            type="tel"
            value={perfilData.telefono}
            onChange={onChangePerfil}
            error={errors.telefono}
            disabled={loading}
          />

          <InputField
            id="carrera"
            label="Carrera"
            value={perfilData.carrera}
            onChange={onChangePerfil}
            disabled
          />
        </div>

        <InputField
          id="direccion"
          label="Dirección"
          value={perfilData.direccion}
          onChange={onChangePerfil}
          error={errors.direccion}
          disabled={loading}
        />

        <div className="flex justify-end">
          <PrimaryButton type="submit" loading={loading} className="w-auto px-6">
            Actualizar Datos
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}