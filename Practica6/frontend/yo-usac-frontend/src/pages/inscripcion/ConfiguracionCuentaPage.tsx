import React, { useEffect, useState } from 'react'
import { authApi } from '../../api/auth'
import { inscripcionApi } from '../../api/inscripcion'
import { notificacionesApi } from '../../api/notificaciones'
import { getUserId } from '../../store/session.store'
import type {
  CuentaFormErrors,
  CuentaTab,
  PerfilFormState,
  SeguridadFormState,
} from '../../types/cuenta.types'
import { Navbar } from '../../components/grabaciones/Navbar'
import { CuentaSidebar } from '../../components/inscripcion/CuentaSidebar'
import { CuentaContent } from '../../components/inscripcion/CuentaContent'

interface ConfiguracionCuentaPageProps {
  onNavigate?: (path: string) => void
}

const CARRERA_NOMBRES: Record<number, string> = {
  1: 'Ingeniería en Ciencias y Sistemas',
  2: 'Ingeniería Industrial',
  3: 'Ingeniería Civil',
  4: 'Ingeniería Mecánica',
  5: 'Ingeniería Electrónica',
  6: 'Ingeniería Química',
}

export const ConfiguracionCuentaPage: React.FC<ConfiguracionCuentaPageProps> = ({
  onNavigate = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<CuentaTab>('informacion')
  const [loading, setLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<CuentaFormErrors>({})
  const [idPerfil, setIdPerfil] = useState<number | null>(null)

  const [perfilData, setPerfilData] = useState<PerfilFormState>({
    nombre: '',
    apellido: '',
    correo: '',
    registroAcademico: '',
    carrera: '',
    dpi: '',
    fechaNacimiento: '',
    telefono: '',
    direccion: '',
  })

  const [seguridadData, setSeguridadData] = useState<SeguridadFormState>({
    passwordActual: '',
    nuevaPassword: '',
    repetirPassword: '',
  })

  useEffect(() => {
    let cancelado = false

    const cargarPerfil = async () => {
      const usuarioRes = await authApi.validar()
      const usuario = usuarioRes.usuario

      let idUsuario = getUserId()
      if (!idUsuario) {
        idUsuario = usuario?.id_usuario ?? null
      }

      const datos = {
        nombre: usuario?.nombre ?? '',
        apellido: usuario?.apellido ?? '',
        correo: usuario?.correo_institucional ?? '',
      }

      let perfil = null
      if (idUsuario) {
        try {
          const perfilRes = await inscripcionApi.consultarPerfil(idUsuario)
          if (perfilRes.exito && perfilRes.perfil) {
            perfil = perfilRes.perfil
          }
        } catch (err) {
          console.warn('No se pudo cargar el perfil académico:', err)
        }
      }

      if (cancelado) return

      setPerfilData((prev) => ({
        ...prev,
        nombre: datos.nombre || prev.nombre,
        apellido: datos.apellido || prev.apellido,
        correo: datos.correo || prev.correo,
        registroAcademico: perfil?.registro_academico ?? prev.registroAcademico,
        dpi: perfil?.dpi ?? prev.dpi,
        fechaNacimiento: perfil?.fecha_nacimiento
          ? String(perfil.fecha_nacimiento).slice(0, 10)
          : prev.fechaNacimiento,
        telefono: perfil?.telefono ?? prev.telefono,
        direccion: perfil?.direccion ?? prev.direccion,
        carrera: CARRERA_NOMBRES[perfil?.id_carrera ?? 0] ?? prev.carrera,
      }))

      if (perfil?.id_perfil) {
        setIdPerfil(perfil.id_perfil)
      }
    }

    cargarPerfil().catch((err) => {
      console.warn('Error al obtener perfil:', err)
    })

    return () => {
      cancelado = true
    }
  }, [])

  const handleChangePerfil = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPerfilData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name as keyof CuentaFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleChangeSeguridad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSeguridadData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name as keyof CuentaFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmitPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const response = await inscripcionApi.cambiarPerfil({
        id_perfil: idPerfil ?? 0,
        dpi: perfilData.dpi,
        fecha_nacimiento: perfilData.fechaNacimiento,
        telefono: perfilData.telefono,
        direccion: perfilData.direccion,
        registro_academico: perfilData.registroAcademico,
      })
      if (response.exito && response.perfil) {
        setIdPerfil(response.perfil.id_perfil)
        setPerfilData((prev) => ({
          ...prev,
          registroAcademico: response.perfil?.registro_academico ?? prev.registroAcademico,
          dpi: response.perfil?.dpi ?? prev.dpi,
          fechaNacimiento: response.perfil?.fecha_nacimiento
            ? String(response.perfil.fecha_nacimiento).slice(0, 10)
            : prev.fechaNacimiento,
          telefono: response.perfil?.telefono ?? prev.telefono,
          direccion: response.perfil?.direccion ?? prev.direccion,
        }))
      } else {
        setErrors({ general: response.mensaje || 'No se pudo actualizar el perfil' })
        return
      }
      alert('¡Datos personales actualizados exitosamente!')
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo actualizar el perfil'
      setErrors({ general: mensaje })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitSeguridad = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: CuentaFormErrors = {}

    if (!seguridadData.passwordActual) {
      newErrors.passwordActual = 'La contraseña actual es requerida'
    }
    if (!seguridadData.nuevaPassword) {
      newErrors.nuevaPassword = 'La nueva contraseña es requerida'
    } else if (seguridadData.nuevaPassword.length < 8) {
      newErrors.nuevaPassword = 'La contraseña debe tener al menos 8 caracteres'
    }
    if (seguridadData.nuevaPassword !== seguridadData.repetirPassword) {
      newErrors.repetirPassword = 'Las contraseñas no coinciden'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const response = await authApi.cambiarPassword({
        password_actual: seguridadData.passwordActual,
        password_nueva: seguridadData.nuevaPassword,
      })
      if (!response.exito) {
        setErrors({ general: response.mensaje || 'No se pudo cambiar la contraseña' })
        return
      }
      alert('¡Contraseña actualizada correctamente!')
      setSeguridadData({ passwordActual: '', nuevaPassword: '', repetirPassword: '' })

      if (perfilData.correo) {
        try {
          await notificacionesApi.enviarAvisoGeneral({
            correo: perfilData.correo,
            asunto: 'Tu contraseña ha sido cambiada',
            mensaje:
              'Te informamos que tu contraseña de Yo USAC fue cambiada correctamente. ' +
              'Si no realizaste este cambio, contacta al administrador de inmediato.',
          })
        } catch (notifErr) {
          console.warn('No se pudo enviar el aviso de cambio de contraseña:', notifErr)
        }
      }
    } catch (err) {
      console.warn('Error al cambiar contraseña:', err)
      setErrors({ general: 'Error al cambiar la contraseña' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <Navbar currentTab="cuenta" onNavigate={onNavigate} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-bold text-neutral-900">Configuración de Cuenta</h1>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <CuentaSidebar activeTab={activeTab} onSelectTab={setActiveTab} />
          </div>

          <div className="lg:col-span-3">
            <CuentaContent
              activeTab={activeTab}
              perfilData={perfilData}
              seguridadData={seguridadData}
              errors={errors}
              loading={loading}
              onChangePerfil={handleChangePerfil}
              onChangeSeguridad={handleChangeSeguridad}
              onSubmitPerfil={handleSubmitPerfil}
              onSubmitSeguridad={handleSubmitSeguridad}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default ConfiguracionCuentaPage