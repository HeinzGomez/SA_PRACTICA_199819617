import React, { useState } from 'react'
import { RepositorioModal } from '../repositorio/RepositorioModal'

interface ClassSidebarProps {
  docentesAuxiliares: string[]
  idClase?: number
  notesOpen?: boolean
  onToggleNotes?: () => void
}

export const ClassSidebar: React.FC<ClassSidebarProps> = ({ docentesAuxiliares, idClase, notesOpen, onToggleNotes }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <aside className="flex flex-col gap-6 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">
          Docentes/Auxiliares
        </h3>
        {docentesAuxiliares.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {docentesAuxiliares.map((docente, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9E1FFF]/10 text-xs font-bold text-[#7a00c9]">
                  {docente.charAt(0)}
                </span>
                {docente}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-400">Sin docentes o auxiliares asignados.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Repositorio</h3>
        {idClase ? (
          <>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#9E1FFF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a00c9]"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Gestor de Repositorio
            </button>
            <RepositorioModal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              idClase={idClase} 
            />
          </>
        ) : (
          <p className="text-sm text-neutral-400">Clase no especificada.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Apuntes</h3>
        <button
          onClick={onToggleNotes}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            notesOpen
              ? 'bg-[#9E1FFF] text-white hover:bg-[#7a00c9]'
              : 'border border-[#9E1FFF] text-[#9E1FFF] hover:bg-[#9E1FFF]/10'
          }`}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          {notesOpen ? 'Cerrar Apuntes' : 'Abrir Apuntes'}
        </button>
      </div>
    </aside>
  )
}