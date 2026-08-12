import { useRef, useState } from "react";
import { apiClient } from "../../api/client";

interface BulkResult {
  success: boolean;
  rowsProcessed: number;
  rowsFailed: number;
  errors: string[];
}

const SAMPLE_CSV = `title,course_id,semester,school,unit,video_url,professors,tags
Clase 1 - Introducción a Microservicios,11111111-1111-1111-1111-111111111111,2026-S2,Ciencias y Sistemas,Unidad 1,https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4,Ing. Juan Pérez;Ing. Ana López,microservicios;grpc
Clase 2 - gRPC y Protocol Buffers,11111111-1111-1111-1111-111111111111,2026-S2,Ciencias y Sistemas,Unidad 2,https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4,Ing. Juan Pérez,grpc;protobuf
`;

/**
 * Módulo de Ingesta masiva CSV (Práctica 3): lee el archivo en el
 * navegador, lo envía en base64 a /admin/recordings/bulk-csv, que a su
 * vez invoca content-service.BulkIngestRecordingsCsv →
 * sp_bulk_ingest_recordings_csv (procedimiento almacenado, inserción
 * transaccional fila por fila).
 */
export default function AdminCsvUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_grabaciones.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Selecciona un archivo .csv primero.");
      return;
    }

    setLoading(true);
    try {
      const csvBase64 = await fileToBase64(file);
      const res = await apiClient.post("/admin/recordings/bulk-csv", { csvBase64 });
      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Error al procesar el archivo CSV.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Carga masiva de grabaciones (CSV)</h2>
      <p className="text-muted">
        Columnas requeridas: <code>title, course_id, semester, school, unit, video_url, professors, tags</code>.
        Los campos <code>professors</code> y <code>tags</code> admiten múltiples valores separados por{" "}
        <code>;</code>.
      </p>

      <button type="button" className="btn btn-secondary" onClick={downloadSample} style={{ marginBottom: 20 }}>
        Descargar plantilla de ejemplo
      </button>

      <form onSubmit={handleUpload} className="form-inline" style={{ marginBottom: 4 }}>
        <input
          className="input"
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          style={{ maxWidth: 320 }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Procesando..." : "Cargar archivo"}
        </button>
      </form>
      {fileName && <p className="text-muted">Archivo seleccionado: {fileName}</p>}

      {error && <p className="alert alert-error">{error}</p>}

      {result && (
        <div className="alert alert-muted" style={{ marginTop: 20 }}>
          <p style={{ margin: 0 }}>
            <span className="badge badge-success" style={{ marginRight: 8 }}>
              {result.rowsProcessed} procesadas
            </span>
            {result.rowsFailed > 0 && (
              <span className="badge" style={{ background: "#fef2f2", color: "#dc2626" }}>
                {result.rowsFailed} fallidas
              </span>
            )}
          </p>
          {result.errors?.length > 0 && (
            <>
              <p style={{ color: "var(--color-danger)", marginBottom: 4, marginTop: 12 }}>Errores:</p>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {result.errors.map((e, i) => (
                  <li key={i} style={{ color: "var(--color-danger)" }}>
                    {e}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // reader.result trae el prefijo "data:...;base64," que hay que recortar
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
