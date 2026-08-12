import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../api/client";

/** Pantalla 4/6: Reproductor con Checkpoint — guarda/recupera el segundo
 * exacto en el que el estudiante detuvo la reproducción. */
export default function Player() {
  const { id } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [savedPosition, setSavedPosition] = useState<number>(0);

  useEffect(() => {
    apiClient.get(`/catalog/recordings/${id}`).then((res) => setVideoUrl(res.data.videoUrl));
    apiClient
      .get(`/catalog/recordings/${id}/checkpoint`)
      .then((res) => setSavedPosition(res.data?.positionSeconds ?? 0))
      .catch(() => setSavedPosition(0));
  }, [id]);

  useEffect(() => {
    if (videoRef.current && savedPosition > 0) {
      videoRef.current.currentTime = savedPosition;
    }
  }, [savedPosition, videoUrl]);

  async function handlePause() {
    const position = Math.floor(videoRef.current?.currentTime ?? 0);
    await apiClient.put(`/catalog/recordings/${id}/checkpoint`, { positionSeconds: position });
    await apiClient.post(`/catalog/recordings/${id}/playback`, { eventType: "pause", positionSeconds: position });
  }

  async function handlePlay() {
    const position = Math.floor(videoRef.current?.currentTime ?? 0);
    await apiClient.post(`/catalog/recordings/${id}/playback`, { eventType: "play", positionSeconds: position });
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1>Reproductor</h1>
      </div>
      <div className="card">
        <video
          ref={videoRef}
          className="video-frame"
          src={videoUrl}
          controls
          onPause={handlePause}
          onPlay={handlePlay}
        />
        <p className="text-muted" style={{ marginBottom: 0, marginTop: 12 }}>
          Reanudando desde el segundo {savedPosition} (último checkpoint guardado).
        </p>
      </div>
    </main>
  );
}
