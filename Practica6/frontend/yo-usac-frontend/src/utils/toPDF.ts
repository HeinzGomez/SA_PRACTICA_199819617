import katex from 'katex'
import 'katex/dist/katex.min.css'

interface ExportPDFOptions {
  titulo: string
  contenido: string
  fechaCreacion?: string
}

const DISPLAY_MATH_REGEX = /\$\$([\s\S]+?)\$\$/g
const INLINE_MATH_REGEX = /\$([^\$\n]+?)\$/g

function renderLatex(html: string): string {
  let result = html.replace(DISPLAY_MATH_REGEX, (_match, tex: string) => {
    try {
      return katex.renderToString(tex.trim(), {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      })
    } catch {
      return `<code>${tex}</code>`
    }
  })

  result = result.replace(INLINE_MATH_REGEX, (_match, tex: string) => {
    try {
      return katex.renderToString(tex.trim(), {
        displayMode: false,
        throwOnError: false,
        output: 'html',
      })
    } catch {
      return `<code>${tex}</code>`
    }
  })

  return result
}

function markdownToSimpleHtml(markdown: string): string {
  let html = markdown
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')

  html = html.replace(/<li>.*?<\/li>/gs, (match) => `<ul>${match}</ul>`)

  html = renderLatex(html)

  return `<p>${html}</p>`
}

function getKaTeXCss(): string {
  const styles: string[] = []
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.cssText?.includes('katex')) {
          styles.push(rule.cssText)
        }
      }
    } catch {
      // cross-origin stylesheet, skip
    }
  }
  return styles.join('\n')
}

function buildPrintHtml(titulo: string, contenidoHtml: string, fechaCreacion?: string): string {
  const fecha = fechaCreacion
    ? new Date(fechaCreacion).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  const katexCss = getKaTeXCss()

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titulo}</title>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      max-width: 700px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #1a1a1a;
      line-height: 1.6;
    }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 20px; margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    h3 { font-size: 17px; margin-top: 18px; }
    .meta { color: #888; font-size: 13px; margin-bottom: 24px; }
    code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-size: 13px; }
    pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; }
    a { color: #7a00c9; }
    blockquote { border-left: 3px solid #9E1FFF; padding-left: 12px; color: #555; }
    ${katexCss}
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${titulo}</h1>
  ${fecha ? `<div class="meta">${fecha}</div>` : ''}
  ${contenidoHtml}
</body>
</html>`
}

export function exportPDF(options: ExportPDFOptions): void {
  const { titulo, contenido, fechaCreacion } = options
  const contenidoHtml = markdownToSimpleHtml(contenido || '(Sin contenido)')
  const html = buildPrintHtml(titulo, contenidoHtml, fechaCreacion)

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }, 500)
  }
}
