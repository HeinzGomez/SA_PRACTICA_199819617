import React, { useState } from 'react'
import type { AdminTab } from '../../types/admin.types'
import { AdminNavbar } from '../../components/admin/AdminNavbar'
import { AnaliticaDashboard } from '../../components/admin/AnaliticaDashboard'
import { AcademicCatalogManager } from '../../components/admin/AcademicCatalogManager'
import { ClasesGrabadasManager } from '../../components/admin/ClasesGrabadasManager'
import { UsersRolesManager } from '../../components/admin/UsersRolesManager'
import { InscripcionesManager } from '../../components/admin/InscripcionesManager'
import { AuditLogsViewer } from '../../components/admin/AuditLogsViewer'

interface AdminPageProps {
  onNavigate?: (path: string) => void
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('analitica')

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 font-sans">
      <AdminNavbar currentTab={activeTab} onNavigate={setActiveTab} onNavigatePath={onNavigate} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        {activeTab === 'analitica' && <AnaliticaDashboard />}
        {activeTab === 'catalogo' && <AcademicCatalogManager />}
        {activeTab === 'clases' && <ClasesGrabadasManager />}
        {activeTab === 'usuarios' && <UsersRolesManager />}
        {activeTab === 'inscripciones' && <InscripcionesManager />}
        {activeTab === 'audit' && <AuditLogsViewer />}
      </main>
    </div>
  )
}

export default AdminPage