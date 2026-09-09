import React from 'react'
import { PlayIcon, PauseIcon, Rewind10Icon, Forward10Icon, FullscreenEnterIcon, FullscreenExitIcon } from './icons'
import { ProgressBar, type Marker } from './ProgressBar'
import { VolumeControl } from './VolumeControl'
import { formatTime } from './useYouTubePlayer'

interface PlayerControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  isFullscreen: boolean
  visible: boolean
  markers?: Marker[]
  onPlayPause: () => void
  onSeek: (seconds: number) => void
  onRewind: () => void
  onForward: () => void
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  onToggleFullscreen: () => void
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  isFullscreen,
  visible,
  markers,
  onPlayPause,
  onSeek,
  onRewind,
  onForward,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
}) => {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="relative flex flex-col gap-0 px-3 pb-2 pt-8">
        {/* Progress bar */}
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          markers={markers}
          onSeek={onSeek}
        />

        {/* Bottom controls row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: play/pause + skip */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRewind}
              className="flex items-center justify-center rounded-md p-1.5 text-white/90 transition hover:bg-white/10"
              title="Retroceder 10 segundos"
            >
              <Rewind10Icon className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onPlayPause}
              className="flex items-center justify-center rounded-md p-1.5 text-white transition hover:bg-white/10"
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6" />
              )}
            </button>

            <button
              type="button"
              onClick={onForward}
              className="flex items-center justify-center rounded-md p-1.5 text-white/90 transition hover:bg-white/10"
              title="Adelantar 10 segundos"
            >
              <Forward10Icon className="h-5 w-5" />
            </button>
          </div>

          {/* Center: time display */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-white/90">
            <span>{formatTime(currentTime)}</span>
            <span className="text-white/50">/</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Right: volume + fullscreen */}
          <div className="flex items-center gap-0.5">
            <VolumeControl
              volume={volume}
              muted={muted}
              onVolumeChange={onVolumeChange}
              onToggleMute={onToggleMute}
            />

            <button
              type="button"
              onClick={onToggleFullscreen}
              className="flex items-center justify-center rounded-md p-1.5 text-white/90 transition hover:bg-white/10"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? (
                <FullscreenExitIcon className="h-5 w-5" />
              ) : (
                <FullscreenEnterIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
