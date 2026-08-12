import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiClient } from "../api/client";

interface RecordingDetail {
  recordingId: string;
  title: string;
  unit: string;
  syllabusUrl: string;
  recordedAt: string;
  professors: string[];
  auxiliaries: string[];
  tags: string[];
}

/** Pantalla 3/6: Detalle de la clase grabada (ficha técnica). */
export default function ClassDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState<RecordingDetail | null>(null);

  useEffect(() => {
    apiClient.get(`/catalog/recordings/${id}`).then((res) => setDetail(res.data));
  }, [id]);

  if (!detail) return <p className="loading-state">Cargando...</p>;

  return (
    <main className="page page--narrow">
      <div className="page-header">
        <h1>{detail.title}</h1>
      </div>

      <div className="card">
        <div className="detail-row">
          <span className="detail-row__label">Unidad</span>
          <span>{detail.unit}</span>
        </div>
        <div className="detail-row">
          <span className="detail-row__label">Fecha de impartición</span>
          <span>{detail.recordedAt}</span>
        </div>
        <div className="detail-row">
          <span className="detail-row__label">Docentes</span>
          <span>{detail.professors?.join(", ") || "—"}</span>
        </div>
        <div className="detail-row">
          <span className="detail-row__label">Auxiliares</span>
          <span>{detail.auxiliaries?.join(", ") || "—"}</span>
        </div>
        <div className="detail-row">
          <span className="detail-row__label">Temas / Etiquetas</span>
          <span>
            {detail.tags?.map((t) => (
              <span key={t} className="badge" style={{ marginRight: 6 }}>
                {t}
              </span>
            )) || "—"}
          </span>
        </div>
        {detail.syllabusUrl && (
          <div className="detail-row">
            <span className="detail-row__label">Material</span>
            <a href={detail.syllabusUrl} target="_blank" rel="noreferrer">
              Sílabo adjunto
            </a>
          </div>
        )}
      </div>

      <Link to={`/reproductor/${detail.recordingId}`}>
        <button className="btn btn-primary" style={{ marginTop: 16 }}>
          Ver grabación
        </button>
      </Link>
    </main>
  );
}
