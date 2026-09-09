import { useCallback, useEffect, useRef } from 'react'

const YT_STATE_UNSTARTED = -1
const YT_STATE_ENDED = 0
const YT_STATE_PLAYING = 1
const YT_STATE_PAUSED = 2
const YT_STATE_BUFFERING = 3
const YT_STATE_CUED = 5

export const PLAYER_STATE = {
  UNSTARTED: YT_STATE_UNSTARTED,
  ENDED: YT_STATE_ENDED,
  PLAYING: YT_STATE_PLAYING,
  PAUSED: YT_STATE_PAUSED,
  BUFFERING: YT_STATE_BUFFERING,
  CUED: YT_STATE_CUED,
} as const

export type PlayerState = (typeof PLAYER_STATE)[keyof typeof PLAYER_STATE]

type YTPlayerInstance = {
  getPlayerState: () => number
  getCurrentTime: () => number
  getDuration: () => number
  getVolume: () => number
  isMuted: () => boolean
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  playVideo: () => void
  pauseVideo: () => void
  setVolume: (volume: number) => void
  mute: () => void
  unMute: () => void
  setSize: (width: number, height: number) => void
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string
          playerVars?: Record<string, string | number | boolean>
          events?: Record<string, (event: { data?: number; target?: YTPlayerInstance }) => void>
        }
      ) => YTPlayerInstance
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeApiReady: Promise<boolean> | null = null

const loadYouTubeApi = (): Promise<boolean> => {
  if (!youtubeApiReady) {
    youtubeApiReady = new Promise<boolean>((resolve) => {
      if (window.YT?.Player) {
        resolve(true)
        return
      }
      window.onYouTubeIframeAPIReady = () => {
        resolve(true)
      }
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.async = true
      tag.onerror = () => {
        resolve(false)
      }
      document.head.appendChild(tag)
    })
  }
  return youtubeApiReady
}

export interface UseYouTubePlayerOptions {
  videoId: string
  containerRef: React.RefObject<HTMLDivElement | null>
  initialSeconds?: number
  onStateChange?: (state: PlayerState) => void
  onReady?: () => void
  onProgress?: (currentTime: number, duration: number) => void
}

export interface YouTubePlayerHandle {
  play: () => void
  pause: () => void
  seekTo: (seconds: number) => void
  setVolume: (volume: number) => void
  getVolume: () => number
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => PlayerState
  isMuted: () => boolean
  mute: () => void
  unmute: () => void
  setSize: (width: number, height: number) => void
}

const PROGRESS_INTERVAL_MS = 250

export function useYouTubePlayer({
  videoId,
  containerRef,
  initialSeconds = 0,
  onStateChange,
  onReady,
  onProgress,
}: UseYouTubePlayerOptions): React.RefObject<YouTubePlayerHandle | null> {
  const playerRef = useRef<YTPlayerInstance | null>(null)
  const handleRef = useRef<YouTubePlayerHandle | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const onStateChangeRef = useRef(onStateChange)
  onStateChangeRef.current = onStateChange
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  const onProgressRef = useRef(onProgress)
  onProgressRef.current = onProgress
  const initialSecondsRef = useRef(initialSeconds)
  initialSecondsRef.current = initialSeconds

  const createHandle = useCallback((player: YTPlayerInstance): YouTubePlayerHandle => ({
    play: () => player.playVideo(),
    pause: () => player.pauseVideo(),
    seekTo: (seconds: number) => player.seekTo(seconds, true),
    setVolume: (volume: number) => player.setVolume(Math.max(0, Math.min(100, volume))),
    getVolume: () => player.getVolume(),
    getCurrentTime: () => player.getCurrentTime(),
    getDuration: () => player.getDuration(),
    getPlayerState: () => player.getPlayerState() as PlayerState,
    isMuted: () => player.isMuted(),
    mute: () => player.mute(),
    unmute: () => player.unMute(),
    setSize: (width: number, height: number) => player.setSize(width, height),
  }), [])

  useEffect(() => {
    if (!videoId || !containerRef.current) return

    let cancelado = false

    const iniciar = async () => {
      const listo = await loadYouTubeApi()
      if (cancelado || !listo || !containerRef.current) return

      containerRef.current.innerHTML = ''

      const player = new window.YT!.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          playsinline: 1,
          enablejsapi: 1,
          controls: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          showinfo: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: () => {
            if (cancelado) return
            if (initialSecondsRef.current > 0) {
              player.seekTo(initialSecondsRef.current, true)
            }
            handleRef.current = createHandle(player)
            onReadyRef.current?.()
          },
          onStateChange: (event) => {
            if (cancelado) return
            const state = event.data as number
            onStateChangeRef.current?.(state as PlayerState)
          },
        },
      })

      playerRef.current = player

      intervalRef.current = setInterval(() => {
        if (cancelado) return
        const state = player.getPlayerState()
        if (state === YT_STATE_PLAYING || state === YT_STATE_BUFFERING) {
          onProgressRef.current?.(player.getCurrentTime(), player.getDuration())
        }
      }, PROGRESS_INTERVAL_MS)
    }

    iniciar()

    return () => {
      cancelado = true
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      playerRef.current = null
      handleRef.current = null
    }
  }, [videoId, containerRef, createHandle])

  return handleRef
}

export function getYouTubeVideoId(rawUrl: string): string {
  if (!rawUrl) return ''
  if (rawUrl.includes('youtu.be/')) {
    return rawUrl.split('youtu.be/')[1]?.split('?')[0] || ''
  }
  if (rawUrl.includes('/embed/')) {
    return rawUrl.split('/embed/')[1]?.split('?')[0] || ''
  }
  if (rawUrl.includes('v=')) {
    return rawUrl.split('v=')[1]?.split('&')[0] || ''
  }
  return ''
}

export function isGoogleDrive(rawUrl: string): boolean {
  return rawUrl.includes('drive.google.com')
}

export function getDriveEmbedUrl(rawUrl: string): string {
  return rawUrl.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview')
}

export interface Marker {
  seconds: number
  label: string
  kind?: 'chapter' | 'duda'
  idDuda?: number
}

export function formatTime(totalSeconds: number): string {
  if (!totalSeconds || !isFinite(totalSeconds)) return '0:00'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
