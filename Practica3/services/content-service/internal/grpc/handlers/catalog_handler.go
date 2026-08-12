package handlers

import (
	"bytes"
	"context"

	"google.golang.org/protobuf/types/known/timestamppb"

	"yousac/content-service/internal/csvparser"
	pb "yousac/content-service/internal/pb"
)

// Metodos de catalogo/busqueda/detalle/ingesta sobre ContentServer
// (ver content_handler.go para la definicion del struct).

func (h *ContentServer) SearchRecordings(ctx context.Context, req *pb.SearchRecordingsRequest) (*pb.SearchRecordingsResponse, error) {
	// El clamp a un maximo de 10 resultados por pagina ocurre dentro de
	// repository.Search (repository.MaxPageSize), como fuente unica de
	// verdad reutilizada tanto aqui como en cualquier otro llamador interno.
	results, total, err := h.Catalog.Search(
		ctx,
		req.GetSemester(),
		req.GetSchool(),
		req.GetCourseId(),
		req.GetProfessorId(),
		req.GetFreeText(),
		int(req.GetPage()),
		int(req.GetPageSize()),
	)
	if err != nil {
		return nil, err
	}

	out := &pb.SearchRecordingsResponse{Total: int32(total)}
	for _, r := range results {
		out.Results = append(out.Results, &pb.RecordingSummary{
			RecordingId: r.RecordingID,
			Title:       r.Title,
			CourseId:    r.CourseID,
			Semester:    r.Semester,
			School:      r.School,
			RecordedAt:  timestamppb.New(r.RecordedAt),
			Tags:        r.Tags,
		})
	}
	return out, nil
}

func (h *ContentServer) GetRecordingDetail(ctx context.Context, req *pb.GetRecordingDetailRequest) (*pb.RecordingDetail, error) {
	d, err := h.Catalog.GetDetail(ctx, req.GetRecordingId())
	if err != nil {
		return nil, err
	}
	return &pb.RecordingDetail{
		RecordingId: d.RecordingID,
		Title:       d.Title,
		CourseId:    d.CourseID,
		Semester:    d.Semester,
		School:      d.School,
		Unit:        d.Unit,
		SyllabusUrl: d.SyllabusURL,
		VideoUrl:    d.VideoURL,
		RecordedAt:  timestamppb.New(d.RecordedAt),
		Professors:  d.Professors,
		Auxiliaries: d.Auxiliaries,
		Tags:        d.Tags,
	}, nil
}

func (h *ContentServer) IngestRecording(ctx context.Context, req *pb.IngestRecordingRequest) (*pb.IngestRecordingResponse, error) {
	id, err := h.Catalog.Ingest(ctx, req.GetTitle(), req.GetCourseId(), req.GetSemester(), req.GetUnit(), req.GetVideoUrl(), req.GetSchool(), req.GetProfessors(), req.GetTags())
	if err != nil {
		return &pb.IngestRecordingResponse{Success: false, ErrorMessage: err.Error()}, nil
	}
	return &pb.IngestRecordingResponse{Success: true, RecordingId: id}, nil
}

// BulkIngestRecordingsCsv (Practica 3): parsea el CSV recibido y delega
// la insercion masiva en sp_bulk_ingest_recordings_csv. RBAC ya fue
// validado por el API Gateway antes de llegar aqui.
func (h *ContentServer) BulkIngestRecordingsCsv(ctx context.Context, req *pb.BulkIngestCsvRequest) (*pb.BulkIngestCsvResponse, error) {
	rows, err := csvparser.Parse(bytes.NewReader(req.GetCsvContent()))
	if err != nil {
		return &pb.BulkIngestCsvResponse{
			Success: false,
			Errors:  []string{err.Error()},
		}, nil
	}

	result, err := h.Catalog.BulkIngestCsv(ctx, req.GetActorUserId(), rows)
	if err != nil {
		return &pb.BulkIngestCsvResponse{
			Success: false,
			Errors:  []string{err.Error()},
		}, nil
	}

	return &pb.BulkIngestCsvResponse{
		Success:       result.RowsFailed == 0,
		RowsProcessed: result.RowsProcessed,
		RowsFailed:    result.RowsFailed,
		Errors:        result.Errors,
	}, nil
}
