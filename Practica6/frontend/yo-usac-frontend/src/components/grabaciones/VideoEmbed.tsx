import React, { useCallback, useEffect, useMemo, useRef } from 'react'

interface VideoEmbedProps {
  url: string
  title?: string
  initialSeconds?: number
  // HeinzGomez - señal de salto a una marca de tiempo (capítulos); nonce fuerza re-ejecución
  seekRequest?: { segundos: number; nonce: number }
  onPlaying?: () => void
  onProgress?: (segundos: number, duracionSegundos: number) => void
  onEnded?: () => void
}

const YT_STATE_PLAYING = 1
const YT_STATE_ENDED = 0

const INTERVALO_PROGRESO_MS = 1000

type YTPlayerInstance = {
  getPlayerState: () => number
  getCurrentTime: () => number
  getDuration: () => number
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  playVideo: () => void
  pauseVideo: () => void
  setVolume: (volume: number) => void
  getVolume: () => number
  isMuted: () => boolean
  mute: () => void
  unMute: () => void
}

const getYouTubeVideoId = (rawUrl: string): string => {
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

const isGoogleDrive = (rawUrl: string): boolean => rawUrl.includes('drive.google.com')

const getDriveEmbedUrl = (rawUrl: string): string =>
  rawUrl.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview')

const getDirectEmbedUrl = (rawUrl: string): string => rawUrl

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

export const VideoEmbed: React.FC<VideoEmbedProps> = ({
  url,
  title = 'Clase Grabada',
  initialSeconds = 0,
  seekRequest,
  onPlaying,
  onProgress,
  onEnded,
}) => {
  const contenedorRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YTPlayerInstance | null>(null)
  const esYouTube = useMemo<boolean>(
    () => getYouTubeVideoId(url) !== '' && !isGoogleDrive(url),
    [url]
  )

  const crearPlayer = useCallback(
    (videoId: string) => {
      if (!contenedorRef.current || !window.YT?.Player) return null
      const player = new window.YT.Player(contenedorRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          playsinline: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (event) => {
            if (initialSeconds > 0) {
              event.target?.seekTo(initialSeconds, true)
            }
          },
          onStateChange: (event) => {
            const state = event.target?.getPlayerState()
            if (state === undefined) return
            if (state === YT_STATE_PLAYING) {
              onPlaying?.()
            } else if (state === YT_STATE_ENDED) {
              onEnded?.()
            }
          },
        },
      })
      return player
    },
    [initialSeconds, onPlaying, onEnded]
  )

  useEffect(() => {
    const videoId = getYouTubeVideoId(url)
    if (!videoId || isGoogleDrive(url)) {
      playerRef.current = null
      return
    }
    let cancelado = false
    let intervalo: ReturnType<typeof setInterval> | null = null
    let player: YTPlayerInstance | null = null

    const iniciar = async () => {
      const listo = await loadYouTubeApi()
      if (cancelado || !listo) return
      if (contenedorRef.current) {
        contenedorRef.current.innerHTML = ''
      }
      player = crearPlayer(videoId)
      playerRef.current = player
      intervalo = setInterval(() => {
        if (!player) return
        const state = player.getPlayerState()
        if (state !== YT_STATE_PLAYING) return
        onProgress?.(player.getCurrentTime(), player.getDuration())
      }, INTERVALO_PROGRESO_MS)
    }

    iniciar()
    return () => {
      cancelado = true
      if (intervalo) clearInterval(intervalo)
      playerRef.current = null
    }
  }, [url, crearPlayer, initialSeconds, onProgress])

  // HeinzGomez - Salta el reproductor de YouTube a la marca de tiempo del capítulo seleccionado
  useEffect(() => {
    if (!seekRequest) return
    const player = playerRef.current
    if (player) {
      player.seekTo(seekRequest.segundos, true)
    }
  }, [seekRequest])

  const renderDriveFallback = () => {
    if (isGoogleDrive(url)) {
      return (
        <iframe
          src={getDriveEmbedUrl(url)}
          title={title}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )
    }
    return null
  }

  const renderIframe = () => {
    if (!url) return null
    return (
      <iframe
        src={getDirectEmbedUrl(url)}
        title={title}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-black">
      {esYouTube ? (
        <div ref={contenedorRef} className="aspect-video w-full" />
      ) : url ? (
        renderDriveFallback() ?? renderIframe()
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-neutral-100 p-6 text-center text-sm text-neutral-500">
          No hay video disponible o el enlace no es válido
        </div>
      )}
    </div>
  )
}