import React from 'react'
import type { MaterialApoyo } from '../../types/grabaciones.types'

interface ClassSidebarProps {
  docentesAuxiliares: string[]
  materiales: MaterialApoyo[]
}

export const ClassSidebar: React.FC<ClassSidebarProps> = ({ docentesAuxiliares, materiales }) => {
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
        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Material Apoyo</h3>
        {materiales.length > 0 ? (
          <div className="flex flex-col gap-2">
            {materiales.map((mat) => (
              <a
                key={mat.id_material}
                href={mat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700 transition hover:bg-[#9E1FFF]/10 hover:text-[#7a00c9]"
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                <span className="truncate">{mat.nombre}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Sin material de apoyo disponible.</p>
        )}
      </div>
    </aside>
  )
}