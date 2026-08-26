import React, { useEffect, useState } from 'react'
import { clearSession } from '../../store/session.store'
import { authApi } from '../../api/auth'
import { consultarAccesoPanelAdmin } from '../../services/roles.service'

interface NavbarProps {
  currentTab?: 'mis-cursos' | 'catalogo' | 'historial' | 'cuenta' | 'admin'
  onNavigate?: (tab: string) => void
  appName?: string
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab = 'catalogo',
  onNavigate = () => {},
  appName = 'YoUsac',
}) => {
  const [accesoAdmin, setAccesoAdmin] = useState(false)

  useEffect(() => {
    let mounted = true
    consultarAccesoPanelAdmin().then((tieneAcceso) => {
      if (mounted) setAccesoAdmin(tieneAcceso)
    })
    return () => {
      mounted = false
    }
  }, [])

  const tabs = [
    { key: 'mis-cursos', label: 'Mis Cursos', path: '/mis-cursos' },
    { key: 'catalogo', label: 'Catálogo', path: '/catalogo' },
    { key: 'historial', label: 'Historial', path: '/historial' },
    { key: 'cuenta', label: 'Cuenta', path: '/cuenta' },
  ]

  if (accesoAdmin) {
    tabs.push({ key: 'admin', label: 'Panel Admin', path: '/admin' })
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.warn('Error al cerrar sesión en el backend:', error)
    }
    clearSession()
    onNavigate('/login')
  }

  return (
    <header className="sticky top-0 z-10 w-full border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="inline-flex items-center gap-2.5 text-xl font-bold text-neutral-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#9E1FFF] to-[#2E1FFF] text-sm font-extrabold text-white">
            U
          </span>
          {appName}
        </span>
        <div className="flex items-center gap-2">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  currentTab === tab.key
                    ? 'bg-[#9E1FFF]/10 text-[#9E1FFF]'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
                onClick={() => onNavigate(tab.path)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            title="Cerrar sesión"
            onClick={handleLogout}
            className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:bg-neutral-100 hover:text-red-600"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}