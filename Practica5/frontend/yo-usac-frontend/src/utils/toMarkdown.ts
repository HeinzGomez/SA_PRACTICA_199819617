interface ExportMarkdownOptions {
  titulo: string
  contenido: string
  fechaCreacion?: string
}

function buildMarkdownHeader(titulo: string, fechaCreacion?: string): string {
  const lineas: string[] = [`# ${titulo}`, '']
  if (fechaCreacion) {
    lineas.push(`> Exportado el ${new Date(fechaCreacion).toLocaleDateString('es-GT')}`, '')
  }
  return lineas.join('\n')
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function sanitizeFilename(titulo: string): string {
  return titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .slice(0, 50)
}

export function exportMarkdown(options: ExportMarkdownOptions): void {
  const { titulo, contenido, fechaCreacion } = options
  const header = buildMarkdownHeader(titulo, fechaCreacion)
  const body = contenido || '(Sin contenido)'
  const fullContent = `${header}\n${body}\n`

  const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' })
  const filename = `${sanitizeFilename(titulo || 'apuntes')}.md`
  triggerDownload(blob, filename)
}
