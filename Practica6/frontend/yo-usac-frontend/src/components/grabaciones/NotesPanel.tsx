import React, { useCallback, useEffect, useRef, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { useNotes } from './notes/useNotes'
import { MarkdownRenderer } from './notes/MarkdownRenderer'
import { TimeMarkerButton } from './notes/TimeMarkerButton'
import { exportMarkdown } from '../../utils/toMarkdown'
import { exportPDF } from '../../utils/toPDF'

interface NotesPanelProps {
  idClase: number
  idUsuario: number
  segundoActual: number
  onSeek: (segundos: number) => void
  isOpen: boolean
  onToggle: () => void
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
  idClase,
  idUsuario,
  segundoActual,
  onSeek,
  isOpen,
  onToggle,
}) => {
  const {
    apunte,
    contenido,
    titulo,
    loading,
    saving,
    setContenido,
    setTitulo,
    insertarMarcaTiempo,
  } = useNotes(idClase, idUsuario)

  const [editing, setEditing] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const handlePreviewClick = useCallback(() => {
    setEditing(true)
  }, [])

  const handleBlur = useCallback(() => {
    blurTimerRef.current = setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setEditing(false)
      }
    }, 150)
  }, [])

  const handleFocusIn = useCallback(() => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current)
      blurTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('focusin', handleFocusIn)
    return () => el.removeEventListener('focusin', handleFocusIn)
  }, [handleFocusIn])

  useEffect(() => {
    if (!exportOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [exportOpen])

  const handleInsertarMarca = useCallback(
    (segundo: number) => {
      insertarMarcaTiempo(segundo)
      if (!editing) setEditing(true)
    },
    [insertarMarcaTiempo, editing]
  )

  const handleExportMarkdown = useCallback(() => {
    exportMarkdown({
      titulo: titulo || 'Sin título',
      contenido,
      fechaCreacion: apunte?.fecha_creacion,
    })
    setExportOpen(false)
  }, [titulo, contenido, apunte])

  const handleExportPDF = useCallback(() => {
    exportPDF({
      titulo: titulo || 'Sin título',
      contenido,
      fechaCreacion: apunte?.fecha_creacion,
    })
    setExportOpen(false)
  }, [titulo, contenido, apunte])

  if (!isOpen) return null

  return (
    <div ref={containerRef} className="flex h-full flex-col" data-notes-panel>
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Apuntes</h3>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-[10px] text-neutral-400">Guardando...</span>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
            title="Cerrar apuntes"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-[#9E1FFF]" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 pt-3">
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título de los apuntes..."
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 outline-none transition focus:border-[#9E1FFF] focus:ring-1 focus:ring-[#9E1FFF]/30"
          />

          <div className="flex items-center gap-2">
            <TimeMarkerButton
              segundoActual={segundoActual}
              onInsert={handleInsertarMarca}
            />

            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setExportOpen(!exportOpen)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exportar
              </button>

              {exportOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-neutral-700 transition hover:bg-neutral-50"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-neutral-700 transition hover:bg-neutral-50"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                    Markdown (.md)
                  </button>
                </div>
              )}
            </div>

            {editing && (
              <span className="text-[10px] text-neutral-400">Escapa o haz clic fuera para guardar</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto" data-color-mode="light">
            {editing ? (
              <div onBlur={handleBlur}>
                <MDEditor
                  value={contenido}
                  onChange={(val) => setContenido(val || '')}
                  height="100%"
                  preview="edit"
                  visibleDragbar={false}
                  hideToolbar={true}
                  autoFocus
                />
              </div>
            ) : (
              <div
                onClick={handlePreviewClick}
                className="min-h-[300px] cursor-text rounded-lg border border-transparent p-2 transition-colors hover:border-neutral-200 hover:bg-neutral-50"
                title="Clic para editar"
              >
                {contenido ? (
                  <MarkdownRenderer contenido={contenido} onSeek={onSeek} />
                ) : (
                  <p className="py-8 text-center text-sm text-neutral-400">
                    Clic aquí para empezar a escribir...
                  </p>
                )}
              </div>
            )}
          </div>

          <p className="text-[10px] text-neutral-400">
            Apuntes Yo usac
          </p>
        </div>
      )}
    </div>
  )
}
