import React, { useEffect, useState } from 'react'
import LoginPage from '../pages/autenticacion/LoginPage'
import RegisterPage from '../pages/autenticacion/RegisterPage'
import CatalogoPage from '../pages/grabaciones/CatalogoPage'
import ReproductorPage from '../pages/grabaciones/ReproductorPage'
import AsignacionesPage from '../pages/inscripcion/AsignacionesPage'
import ConfiguracionCuentaPage from '../pages/inscripcion/ConfiguracionCuentaPage'
import AdminPage from '../pages/admin/AdminPage'
import HistorialPage from '../pages/historial/HistorialPage'
import { consultarAccesoPanelAdmin } from '../services/roles.service'

const AdminRouteGuard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [verificado, setVerificado] = useState(false)
  const [tieneAcceso, setTieneAcceso] = useState(false)

  useEffect(() => {
    let mounted = true
    consultarAccesoPanelAdmin().then((acceso) => {
      if (!mounted) return
      setTieneAcceso(acceso)
      setVerificado(true)
      if (!acceso) {
        onNavigate('/mis-cursos')
      }
    })
    return () => {
      mounted = false
    }
  }, [onNavigate])

  if (!verificado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-400">
        <p className="text-sm">Verificando permisos...</p>
      </div>
    )
  }

  if (!tieneAcceso) {
    return null
  }

  return <AdminPage onNavigate={onNavigate} />
}

export const AppRouter: React.FC<{ path: string }> = ({ path }) => {
  const searchParams = new URLSearchParams(window.location.search)

  const navigateTo = (newPath: string) => {
    window.history.pushState({}, '', newPath)
    window.dispatchEvent(new Event('popstate'))
  }

  if (path === '/registro') {
    return (
      <RegisterPage
        onNavigateToLogin={() => navigateTo('/login')}
        onSuccessRegister={() => {
          alert('¡Registro completado exitosamente! Ahora puedes iniciar sesión.')
          navigateTo('/login')
        }}
      />
    )
  }

  if (path === '/mis-cursos') {
    return <AsignacionesPage onNavigate={navigateTo} />
  }

  if (path === '/catalogo') {
    return <CatalogoPage onNavigate={navigateTo} />
  }

  if (path === '/historial') {
    return <HistorialPage onNavigate={navigateTo} />
  }

  if (path === '/reproductor') {
    const idClase = Number(searchParams.get('id')) || 1
    return <ReproductorPage idClase={idClase} onNavigate={navigateTo} />
  }

  if (path === '/cuenta') {
    return <ConfiguracionCuentaPage onNavigate={navigateTo} />
  }

  if (path === '/admin') {
    return <AdminRouteGuard onNavigate={navigateTo} />
  }

  return (
    <LoginPage
      onNavigateToRegister={() => navigateTo('/registro')}
      onSuccessLogin={(route) => navigateTo(route)}
    />
  )
}
