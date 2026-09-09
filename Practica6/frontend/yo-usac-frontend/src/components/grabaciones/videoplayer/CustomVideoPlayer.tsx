import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  useYouTubePlayer,
  getYouTubeVideoId,
  isGoogleDrive,
  getDriveEmbedUrl,
  PLAYER_STATE,
} from './useYouTubePlayer'
import type { Marker } from './useYouTubePlayer'
import { PlayerControls } from './PlayerControls'

export interface CustomVideoPlayerProps {
  url: string
  title?: string
  initialSeconds?: number
  seekRequest?: { segundos: number; nonce: number }
  onPlaying?: () => void
  onProgress?: (segundos: number, duracionSegundos: number) => void
  onEnded?: () => void
  markers?: Marker[]
}

const AUTO_HIDE_DELAY_MS = 3000

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  url,
  title = 'Clase Grabada',
  initialSeconds = 0,
  seekRequest,
  onPlaying,
  onProgress,
  onEnded,
  markers,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(80)
  const [muted, setMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)

  const esYouTube = getYouTubeVideoId(url) !== '' && !isGoogleDrive(url)
  const esDrive = isGoogleDrive(url)

  const videoId = esYouTube ? getYouTubeVideoId(url) : ''

  const handleProgress = useCallback(
    (time: number, dur: number) => {
      setCurrentTime(time)
      setDuration(dur)
      onProgress?.(time, dur)
    },
    [onProgress]
  )

  const handleStateChange = useCallback(
    (state: number) => {
      if (state === PLAYER_STATE.PLAYING) {
        setIsPlaying(true)
        onPlaying?.()
      } else if (state === PLAYER_STATE.PAUSED) {
        setIsPlaying(false)
      } else if (state === PLAYER_STATE.ENDED) {
        setIsPlaying(false)
        onEnded?.()
      }
    },
    [onPlaying, onEnded]
  )

  const playerHandle = useYouTubePlayer({
    videoId,
    containerRef,
    initialSeconds,
    onStateChange: handleStateChange,
    onProgress: handleProgress,
  })

  // Sync volume state from player
  useEffect(() => {
    if (!playerHandle.current) return
    const interval = setInterval(() => {
      const h = playerHandle.current
      if (!h) return
      setVolumeState(h.getVolume())
      setMuted(h.isMuted())
    }, 500)
    return () => clearInterval(interval)
  }, [playerHandle, esYouTube])

  // SeekRequest handler — mirrors original VideoEmbed behavior for chapters/notes
  useEffect(() => {
    if (!seekRequest) return
    const h = playerHandle.current
    if (h) {
      h.seekTo(seekRequest.segundos)
      setCurrentTime(seekRequest.segundos)
    }
  }, [seekRequest, playerHandle])

  // Auto-hide controls
  const resetAutoHide = useCallback(() => {
    setControlsVisible(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false)
      }
    }, AUTO_HIDE_DELAY_MS)
  }, [isPlaying])

  useEffect(() => {
    if (isPlaying) {
      resetAutoHide()
    } else {
      setControlsVisible(true)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying, resetAutoHide])

  const handleMouseMove = useCallback(() => {
    resetAutoHide()
  }, [resetAutoHide])

  const handlePlayPause = useCallback(() => {
    const h = playerHandle.current
    if (!h) return
    if (isPlaying) {
      h.pause()
    } else {
      h.play()
    }
  }, [isPlaying, playerHandle])

  const handleRewind = useCallback(() => {
    const h = playerHandle.current
    if (!h) return
    const newTime = Math.max(0, h.getCurrentTime() - 10)
    h.seekTo(newTime)
    setCurrentTime(newTime)
  }, [playerHandle])

  const handleForward = useCallback(() => {
    const h = playerHandle.current
    if (!h) return
    const newTime = Math.min(h.getDuration(), h.getCurrentTime() + 10)
    h.seekTo(newTime)
    setCurrentTime(newTime)
  }, [playerHandle])

  const handleSeek = useCallback(
    (seconds: number) => {
      const h = playerHandle.current
      if (h) {
        h.seekTo(seconds)
      }
      setCurrentTime(seconds)
    },
    [playerHandle]
  )

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      const h = playerHandle.current
      if (!h) return
      h.setVolume(newVolume)
      setVolumeState(newVolume)
      if (newVolume > 0 && muted) {
        h.unmute()
        setMuted(false)
      }
    },
    [playerHandle, muted]
  )

  const handleToggleMute = useCallback(() => {
    const h = playerHandle.current
    if (!h) return
    if (muted) {
      h.unmute()
      setMuted(false)
    } else {
      h.mute()
      setMuted(true)
    }
  }, [playerHandle, muted])

  const handleToggleFullscreen = useCallback(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    if (!document.fullscreenElement) {
      wrapper.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(() => {
        /* fullscreen not supported or denied */
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch(() => {
        /* ignore */
      })
    }
  }, [])

  // Listen for fullscreen changes — CSS handles sizing, no setSize() calls
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          handlePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleRewind()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleForward()
          break
        case 'f':
          e.preventDefault()
          handleToggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          handleToggleMute()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handlePlayPause, handleRewind, handleForward, handleToggleFullscreen, handleToggleMute])

  // ─── Render YouTube with custom controls ────────────────
  if (esYouTube) {
    return (
      <div
        ref={wrapperRef}
        className="vp-fullscreen-wrapper relative overflow-hidden rounded-xl border border-neutral-200 bg-black group/player"
        onMouseMove={handleMouseMove}
        onMouseEnter={resetAutoHide}
      >
        {/* YouTube player container — native controls hidden via controls:0 */}
        <div ref={containerRef} className="relative aspect-video w-full overflow-hidden" />

        {/* Custom controls overlay */}
        <PlayerControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          muted={muted}
          isFullscreen={isFullscreen}
          visible={controlsVisible}
          markers={markers}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onRewind={handleRewind}
          onForward={handleForward}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </div>
    )
  }

  // ─── Render Google Drive embed ──────────────────────────
  if (esDrive) {
    return (
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-black">
        <iframe
          src={getDriveEmbedUrl(url)}
          title={title}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  // ─── Render generic iframe ──────────────────────────────
  if (url) {
    return (
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-black">
        <iframe
          src={url}
          title={title}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  // ─── No URL placeholder ─────────────────────────────────
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-black">
      <div className="flex aspect-video w-full items-center justify-center bg-neutral-100 p-6 text-center text-sm text-neutral-500">
        No hay video disponible o el enlace no es válido
      </div>
    </div>
  )
}
