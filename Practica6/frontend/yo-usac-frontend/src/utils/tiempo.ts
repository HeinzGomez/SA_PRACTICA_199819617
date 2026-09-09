// HeinzGomez - Utilidades de formato/parseo de marcas de tiempo para capítulos
export function formatearTiempo(segundosTotales: number): string {
  const seguro = Math.max(0, Math.floor(segundosTotales || 0))
  const horas = Math.floor(seguro / 3600)
  const minutos = Math.floor((seguro % 3600) / 60)
  const segundos = seguro % 60
  const dos = (n: number) => n.toString().padStart(2, '0')
  return horas > 0 ? `${horas}:${dos(minutos)}:${dos(segundos)}` : `${dos(minutos)}:${dos(segundos)}`
}

// HeinzGomez - Convierte "MM:SS" o "H:MM:SS" a segundos; devuelve null si es inválido
export function parsearTiempo(valor: string): number | null {
  const limpio = (valor || '').trim()
  if (!/^\d{1,2}(:\d{1,2}){1,2}$/.test(limpio)) return null
  const partes = limpio.split(':').map((p) => Number(p))
  if (partes.some((n) => Number.isNaN(n))) return null
  let horas = 0
  let minutos = 0
  let segundos = 0
  if (partes.length === 3) {
    ;[horas, minutos, segundos] = partes
  } else {
    ;[minutos, segundos] = partes
  }
  if (minutos > 59 || segundos > 59) return null
  return horas * 3600 + minutos * 60 + segundos
}
