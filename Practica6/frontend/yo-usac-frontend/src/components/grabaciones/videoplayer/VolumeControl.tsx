import React, { useCallback, useRef, useState } from 'react'
import { VolumeHighIcon, VolumeLowIcon, VolumeMuteIcon } from './icons'

interface VolumeControlProps {
  volume: number
  muted: boolean
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const effectiveVolume = muted ? 0 : volume

  const getVolumeIcon = () => {
    if (muted || effectiveVolume === 0) return VolumeMuteIcon
    if (effectiveVolume < 50) return VolumeLowIcon
    return VolumeHighIcon
  }

  const VolumeIcon = getVolumeIcon()

  const getVolumeFromEvent = useCallback((e: React.MouseEvent | MouseEvent): number => {
    if (!sliderRef.current) return 0
    const rect = sliderRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    return Math.round((x / rect.width) * 100)
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      const vol = getVolumeFromEvent(e)
      onVolumeChange(vol)

      const handleMouseMove = (ev: MouseEvent) => {
        ev.preventDefault()
        const v = getVolumeFromEvent(ev)
        onVolumeChange(v)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [getVolumeFromEvent, onVolumeChange]
  )

  const handleButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggleMute()
    },
    [onToggleMute]
  )

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        if (!isDragging) setIsExpanded(false)
      }}
    >
      <button
        type="button"
        onClick={handleButtonClick}
        className="flex items-center justify-center rounded-md p-1.5 text-white/90 transition hover:bg-white/10"
        title={muted ? 'Activar sonido' : 'Silenciar'}
      >
        <VolumeIcon className="h-5 w-5" />
      </button>

      <div
        className={`flex items-center overflow-hidden transition-all duration-200 ${
          isExpanded ? 'w-20 opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <div
          ref={sliderRef}
          className="group/vol relative mx-1 h-1 w-full cursor-pointer rounded-full bg-white/20"
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[#9E1FFF]"
            style={{ width: `${effectiveVolume}%` }}
          />
          <div
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm opacity-0 transition-opacity group-hover/vol:opacity-100"
            style={{ left: `${effectiveVolume}%` }}
          />
        </div>
      </div>
    </div>
  )
}
