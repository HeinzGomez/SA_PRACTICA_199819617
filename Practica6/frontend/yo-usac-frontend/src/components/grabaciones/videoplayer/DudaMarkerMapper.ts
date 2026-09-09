import type { DudaInfo } from '../../../types/recursos.types'
import type { Marker } from './ProgressBar'

const MAX_DUDA_LENGTH = 80

export function dudasToMarkers(dudas: DudaInfo[]): Marker[] {
  return dudas
    .filter((d): d is DudaInfo & { segundo: number } => d.segundo != null && d.segundo >= 0)
    .map((d) => ({
      seconds: d.segundo,
      label: truncate(d.duda, MAX_DUDA_LENGTH),
      kind: 'duda' as const,
      idDuda: d.id_dudas,
    }))
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}
