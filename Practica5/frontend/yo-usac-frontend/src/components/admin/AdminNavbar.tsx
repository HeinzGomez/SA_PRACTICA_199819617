import React from 'react'
import { clearSession } from '../../store/session.store'
import { authApi } from '../../api/auth'
import type { AdminTab } from '../../types/admin.types'

interface AdminNavbarProps {
  currentTab?: AdminTab
  onNavigate?: (tab: AdminTab) => void
  onNavigatePath?: (path: string) => void
  appName?: string
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  currentTab = 'analitica',
  onNavigate = () => {},
  onNavigatePath,
  appName = 'YoUsac',
}) => {
  
  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'analitica', label: 'Analítica & Tendencias' },
    { key: 'catalogo', label: 'Catálogo Académico' },
    { key: 'clases', label: 'Clases Grabadas' },
    { key: 'usuarios', label: 'Usuarios y Roles' },
    { key: 'inscripciones', label: 'Inscripciones' },
    { key: 'audit', label: 'Audit Logs' },
  ]

  return (
    <header className="sticky top-0 z-10 w-full border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-4">
        <span className="inline-flex items-center gap-2.5 text-xl font-bold text-neutral-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#9E1FFF] to-[#2E1FFF] text-sm font-extrabold text-white">
            U
          </span>
          {appName}
        </span>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#9E1FFF]/10 px-3 py-1 text-xs font-semibold text-[#7a00c9]">
            Panel Admin
          </span>
          <button
            type="button"
            title="Ver el panel de estudiante"
            onClick={() => {
              if (typeof onNavigatePath === 'function') {
                onNavigatePath('/mis-cursos')
                return
              }
              window.location.href = '/mis-cursos'
            }}
            className="ml-2 flex h-9 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-[#9E1FFF]"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Panel de Estudiante
          </button>
          <button
            type="button"
            title="Cerrar sesión"
            onClick={async () => {
              try {
                await authApi.logout()
              } catch (error) {
                console.warn('Error al cerrar sesión en el backend:', error)
              }
              clearSession()
              if (typeof onNavigatePath === 'function') {
                onNavigatePath('/login')
                return
              }
              try {
                window.history.pushState({}, '', '/login')
                window.dispatchEvent(new PopStateEvent('popstate'))
              } catch (e) {
                window.location.href = '/login'
              }
            }}
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

      <div className="mx-auto flex max-w-6xl gap-1 px-6 pb-3 pt-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              currentTab === tab.key
                ? 'bg-[#9E1FFF]/10 text-[#9E1FFF]'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
            onClick={() => onNavigate(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  )
}