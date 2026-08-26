import React from 'react'

interface PaginadorProps {
  paginaActual: number
  totalPaginas: number
  onChange: (pagina: number) => void
}

export const Paginador: React.FC<PaginadorProps> = ({
  paginaActual,
  totalPaginas,
  onChange,
}) => {
  if (totalPaginas <= 1) return null

  const paginas: number[] = []
  const inicio = Math.max(1, paginaActual - 2)
  const fin = Math.min(totalPaginas, inicio + 4)
  for (let p = inicio; p <= fin; p += 1) {
    paginas.push(p)
  }

  const claseBase =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors'
  const claseActiva = 'bg-[#9E1FFF] text-white'
  const claseInactiva =
    'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50'

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Paginación">
      <button
        type="button"
        className={`${claseBase} ${claseInactiva}`}
        disabled={paginaActual <= 1}
        onClick={() => onChange(paginaActual - 1)}
        aria-label="Página anterior"
      >
        ‹
      </button>

      {paginas.map((p) => (
        <button
          key={p}
          type="button"
          className={`${claseBase} ${p === paginaActual ? claseActiva : claseInactiva}`}
          onClick={() => onChange(p)}
          aria-current={p === paginaActual ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        className={`${claseBase} ${claseInactiva}`}
        disabled={paginaActual >= totalPaginas}
        onClick={() => onChange(paginaActual + 1)}
        aria-label="Página siguiente"
      >
        ›
      </button>
    </nav>
  )
}
