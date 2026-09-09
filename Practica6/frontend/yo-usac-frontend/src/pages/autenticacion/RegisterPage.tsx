import React, { useEffect, useState } from 'react'
import { authApi } from '../../api/auth'
import { inscripcionApi } from '../../api/inscripcion'
import { notificacionesApi } from '../../api/notificaciones'
import { extraerMensajeError } from '../../api/axios'
import type { RegisterFormData, RegisterFormErrors } from '../../types/registro.types'
import { Header } from '../../components/autenticacion/Header'
import { RegisterForm } from '../../components/autenticacion/RegisterForm'

interface RegisterPageProps {
  onNavigateToLogin?: () => void
  onSuccessRegister?: () => void
}

interface CarreraOption {
  label: string
  value: number
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateToLogin = () => {
    console.log('Navegar a login')
  },
  onSuccessRegister = () => {
    console.log('Registro exitoso')
  },
}) => {
  const [carreraOptions, setCarreraOptions] = useState<CarreraOption[]>([])
  const [carrerasError, setCarrerasError] = useState<string>('')
  const [formData, setFormData] = useState<RegisterFormData>({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    dpi: '',
    fechaNacimiento: '',
    carnet: '',
    telefono: '',
    direccion: '',
    carrera: '',
  })

  const [errors, setErrors] = useState<RegisterFormErrors>({})
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    let cancelado = false

    const cargarCarreras = async () => {
      try {
        const response = await inscripcionApi.consultarCarreras()
        if (cancelado) return
        if (response.exito && response.carreras) {
          setCarreraOptions(
            response.carreras.map((carrera) => ({
              label: carrera.nombre,
              value: carrera.id_carrera,
            }))
          )
          setCarrerasError('')
        } else {
          setCarrerasError(response.mensaje || 'No se pudieron cargar las carreras')
        }
      } catch (err) {
        if (cancelado) return
        setCarrerasError(extraerMensajeError(err) || 'No se pudieron cargar las carreras')
      }
    }

    cargarCarreras()

    return () => {
      cancelado = true
    }
  }, [])

  const validate = (): boolean => {
    const newErrors: RegisterFormErrors = {}

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido'
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido'

    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo institucional es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = 'Formato de correo no válido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (!formData.dpi.trim()) {
      newErrors.dpi = 'El DPI es requerido'
    } else if (!/^\d+$/.test(formData.dpi)) {
      newErrors.dpi = 'El DPI debe contener solo números'
    }

    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida'
    }

    if (!formData.carnet.trim()) {
      newErrors.carnet = 'El carnet/registro académico es requerido'
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    }

    if (!formData.carrera) {
      newErrors.carrera = 'Debe seleccionar una carrera'
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name as keyof RegisterFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      // 1. Registrar usuario en Auth API
      const regResponse = await authApi.registrar({
        nombre: formData.nombre,
        apellido: formData.apellido,
        correo: formData.correo,
        password: formData.password,
      })

      if (!regResponse.exito || !regResponse.usuario?.id_usuario) {
        setErrors({
          general: regResponse.mensaje || 'No se pudo crear el usuario. Intenta nuevamente.',
        })
        return
      }

      // 2. Guardar datos académicos del usuario en Inscripcion API
      const perfilResponse = await inscripcionApi.crearPerfil({
        id_usuario: regResponse.usuario.id_usuario,
        registro_academico: formData.carnet,
        dpi: formData.dpi,
        fecha_nacimiento: formData.fechaNacimiento,
        telefono: formData.telefono,
        id_carrera: Number(formData.carrera) || 1,
        direccion: formData.direccion,
      })

      if (!perfilResponse.exito) {
        setErrors({
          general:
            perfilResponse.mensaje ||
            'El usuario se creó, pero no se pudieron guardar sus datos académicos.',
        })
        return
      }

      // 3. Enviar correo de notificación de registro (no bloquea el flujo si falla)
      try {
        await notificacionesApi.enviarRegistro({
          correo: formData.correo,
          nombre_usuario: `${formData.nombre} ${formData.apellido}`.trim(),
        })
      } catch {
        console.warn('No se pudo enviar el correo de notificación de registro')
      }

      onSuccessRegister()
    } catch (err: unknown) {
      const errorMsg = extraerMensajeError(err) || 'Error al realizar el registro'
      setErrors({
        general: errorMsg,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header appName="YoUsac" />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <RegisterForm
          formData={formData}
          errors={errors}
          loading={loading}
          carreraOptions={carreraOptions}
          carrerasError={carrerasError}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onNavigateToLogin={onNavigateToLogin}
        />
      </main>
    </div>
  )
}

export default RegisterPage
