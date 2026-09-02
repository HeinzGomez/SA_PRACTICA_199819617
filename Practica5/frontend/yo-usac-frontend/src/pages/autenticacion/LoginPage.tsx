import React, { useState, useEffect } from 'react'
import { authApi } from '../../api/auth'
import { inscripcionApi } from '../../api/inscripcion'
import { extraerMensajeError } from '../../api/axios'
import { setUserId } from '../../store/session.store'
import type { LoginFormData, LoginFormErrors } from '../../types/login.types'
import { Header } from '../../components/autenticacion/Header'
import { LoginForm } from '../../components/autenticacion/LoginForm'

interface LoginPageProps {
  onNavigateToRegister?: () => void
  onSuccessLogin?: (route: string) => void
}

const DEFAULT_LOGIN_ERROR = 'Credenciales inválidas o error de conexión'

function resolverDestinoPorRol(roles: { rol: string }[]): string {
  const nombresRoles = roles.map((rol) => rol.rol.trim().toLowerCase())
  const esPersonalAcademico = ['administrador', 'docente', 'auxiliar'].some((rol) =>
    nombresRoles.includes(rol)
  )
  return esPersonalAcademico ? '/admin' : '/mis-cursos'
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToRegister = () => {
    console.log('Navegar a registro')
  },
  onSuccessLogin = () => {
    console.log('Login exitoso')
  },
}) => {
  const [formData, setFormData] = useState<LoginFormData>({
    correo: '',
    password: '',
  })

  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingGoogle, setLoadingGoogle] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    const verificarSesion = async () => {
      try {
        const res = await authApi.validar()
        if (mounted && res.exito && res.sesion?.id_sesion && res.usuario?.id_usuario) {
          const idUsuario = res.usuario.id_usuario
          setUserId(idUsuario)
          let destino = '/mis-cursos'
          try {
            const rolesRes = await inscripcionApi.consultarRolesUsuario(idUsuario)
            if (rolesRes.exito && rolesRes.roles) {
              destino = resolverDestinoPorRol(rolesRes.roles)
            }
          } catch (rolErr) {
            console.warn('No se pudo verificar el rol del usuario:', rolErr)
          }
          onSuccessLogin(destino)
        }
      } catch (err) {
        // ignore
      }
    }
    verificarSesion()
    return () => { mounted = false }
  }, [onSuccessLogin])

  const validate = (): boolean => {
    const newErrors: LoginFormErrors = {}

    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo institucional es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = 'Formato de correo no válido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear line error as user types
    if (errors[name as keyof LoginFormErrors]) {
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
      const response = await authApi.login({
        correo: formData.correo,
        password: formData.password,
      })

      if (!response.exito) {
        setErrors({
          general: response.mensaje || 'Error al iniciar sesión. Intenta nuevamente.',
        })
        return
      }

      // if (response.access_token) {
      //   setAccessToken(response.access_token)
      // }

      const idUsuario = response.sesion?.id_usuario
      if (idUsuario) {
        setUserId(idUsuario)
      }
      let destino = '/mis-cursos'

      if (idUsuario) {
        try {
          const rolesRes = await inscripcionApi.consultarRolesUsuario(idUsuario)
          if (rolesRes.exito && rolesRes.roles) {
            destino = resolverDestinoPorRol(rolesRes.roles)
          }
        } catch (rolErr) {
          console.warn('No se pudo verificar el rol del usuario:', rolErr)
        }
      }

      onSuccessLogin(destino)
    } catch (err: unknown) {
      const errorMsg = extraerMensajeError(err) || DEFAULT_LOGIN_ERROR
      setErrors({
        general: errorMsg,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async (): Promise<void> => {
    setLoadingGoogle(true)
    setErrors({})

    try {
      window.location.href = '/api/auth/google'
    } finally {
      setLoadingGoogle(false)
    }
  }

return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header appName="YoUsac" />

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          <LoginForm
            formData={formData}
            errors={errors}
            loading={loading}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onNavigateToRegister={onNavigateToRegister}
          />

          {/* Separador */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300" />

            <span className="px-4 text-sm text-gray-500">
              O continúa con
            </span>

            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Botón Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loadingGoogle || loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingGoogle ? (
              <span>
                Conectando con Google...
              </span>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M21.35 12.23c0-.79-.07-1.55-.23-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 21.77c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.77z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.54 13.87a5.85 5.85 0 0 1 0-3.74V7.6H3.3a9.75 9.75 0 0 0 0 8.8l3.24-2.53z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 6.1c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.1 14.63 2.23 12 2.23a9.74 9.74 0 0 0-8.7 5.37l3.24 2.53C7.31 7.82 9.46 6.1 12 6.1z"
                  />
                </svg>

                <span>
                  Continuar con Google
                </span>
              </>
            )}
          </button>

        </div>
      </main>
    </div>
  )
}

export default LoginPage
