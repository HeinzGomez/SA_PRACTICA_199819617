import React, { useCallback, useRef, useState } from 'react'
import { formatTime } from './useYouTubePlayer'

export interface Marker {
  seconds: number
  label: string
  kind?: 'chapter' | 'duda'
  idDuda?: number
}

interface ProgressBarProps {
  currentTime: number
  duration: number
  markers?: Marker[]
  onSeek: (seconds: number) => void
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  markers = [],
  onSeek,
}) => {
  const barRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverX, setHoverX] = useState(0)
  const [tooltipMarker, setTooltipMarker] = useState<Marker | null>(null)

  const safeDuration = duration > 0 ? duration : 1
  const progress = Math.min((currentTime / safeDuration) * 100, 100)

  const getTimeFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent): number => {
      if (!barRef.current) return 0
      const rect = barRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      return (x / rect.width) * safeDuration
    },
    [safeDuration]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      const time = getTimeFromEvent(e)
      onSeek(time)

      const handleMouseMove = (ev: MouseEvent) => {
        const t = getTimeFromEvent(ev)
        onSeek(t)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [getTimeFromEvent, onSeek]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return
      const time = getTimeFromEvent(e)
      setHoverTime(time)
      const rect = barRef.current?.getBoundingClientRect()
      if (rect) {
        setHoverX(e.clientX - rect.left)
      }

      const closest = findClosestMarker(e.clientX, markers, barRef.current)
      setTooltipMarker(closest)
    },
    [isDragging, getTimeFromEvent, markers]
  )

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setHoverTime(null)
      setTooltipMarker(null)
    }
  }, [isDragging])

  return (
    <div className="group/progress relative w-full px-0 py-1">
      <div
        ref={barRef}
        className="relative h-1.5 w-full cursor-pointer rounded-full bg-white/20 transition-all group-hover/progress:h-2.5"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Filled portion */}
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[#9E1FFF]"
          style={{ width: `${progress}%` }}
        />

        {/* Draggable thumb */}
        <div
          className="absolute top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9E1FFF] shadow-md opacity-0 transition-opacity group-hover/progress:opacity-100"
          style={{ left: `${progress}%` }}
        />

        {/* Markers */}
        {markers.map((marker, i) => {
          const pos = (marker.seconds / safeDuration) * 100
          if (pos < 0 || pos > 100) return null
          if (marker.kind === 'duda') {
            return (
              <div
                key={i}
                className="absolute z-5 -translate-x-1/2 cursor-pointer transition-transform hover:scale-125"
                style={{ left: `${pos}%`, top: '-18px' }}
                title={marker.label}
              >
                <div className="flex flex-col items-center">
                  <span className="rounded bg-[#2E1FFF] px-1 py-px text-[8px] font-bold leading-tight text-white shadow-sm">
                    Duda
                  </span>
                  <div className="h-0 w-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-[#2E1FFF]" />
                </div>
              </div>
            )
          }
          return (
            <div
              key={i}
              className="absolute top-1/2 z-5 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-[#ff1ff0] shadow-sm ring-2 ring-white/50 transition-transform hover:scale-150"
              style={{ left: `${pos}%` }}
              title={marker.label}
            />
          )
        })}
      </div>

      {/* Time tooltip on hover */}
      {hoverTime !== null && !isDragging && (
        <>
          {tooltipMarker?.kind === 'duda' ? (
            <div
              className="pointer-events-none absolute z-20 mb-2 w-48 -translate-x-1/2 rounded-lg border border-neutral-700 bg-neutral-900 p-2.5 shadow-xl"
              style={{
                left: Math.min(Math.max(hoverX, 96), (barRef.current?.clientWidth ?? 0) - 96),
                bottom: '100%',
              }}
            >
              <span className="mb-1 inline-block rounded bg-[#2E1FFF]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#9E1FFF]">
                {formatTime(tooltipMarker.seconds)}
              </span>
              <p className="mt-1 text-xs leading-snug text-neutral-200">{tooltipMarker.label}</p>
            </div>
          ) : (
            <div
              className="pointer-events-none absolute -top-8 z-20 -translate-x-1/2 rounded-md bg-black/80 px-2 py-0.5 text-xs text-white"
              style={{ left: Math.min(Math.max(hoverX, 24), (barRef.current?.clientWidth ?? 0) - 24) }}
            >
              {tooltipMarker ? tooltipMarker.label : formatTime(hoverTime)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function findClosestMarker(
  clientX: number,
  markers: Marker[],
  bar: HTMLDivElement | null
): Marker | null {
  if (!bar || markers.length === 0) return null
  const rect = bar.getBoundingClientRect()
  const threshold = 12
  let closest: Marker | null = null
  let minDist = Infinity

  for (const marker of markers) {
    const pos = rect.left + (marker.seconds / (bar.dataset.duration ? Number(bar.dataset.duration) : 1)) * rect.width
    const dist = Math.abs(clientX - pos)
    if (dist < threshold && dist < minDist) {
      minDist = dist
      closest = marker
    }
  }
  return closest
}
