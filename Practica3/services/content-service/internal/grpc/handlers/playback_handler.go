package handlers

import (
	"context"

	"google.golang.org/protobuf/types/known/timestamppb"

	pb "yousac/content-service/internal/pb"
)

// Metodos de reproduccion/checkpoints/historial sobre ContentServer.
// Disenados para alta concurrencia: cada evento es una escritura simple e
// independiente (sin locks de larga duracion) para soportar picos durante
// epocas de examenes.

func (h *ContentServer) RegisterPlaybackEvent(ctx context.Context, req *pb.PlaybackEventRequest) (*pb.PlaybackEventResponse, error) {
	err := h.Playback.RegisterEvent(ctx, req.GetUserId(), req.GetRecordingId(), req.GetEventType(), req.GetPositionSeconds())
	if err != nil {
		return &pb.PlaybackEventResponse{Accepted: false}, err
	}
	return &pb.PlaybackEventResponse{Accepted: true}, nil
}

func (h *ContentServer) SaveCheckpoint(ctx context.Context, req *pb.SaveCheckpointRequest) (*pb.SaveCheckpointResponse, error) {
	err := h.Playback.SaveCheckpoint(ctx, req.GetUserId(), req.GetRecordingId(), req.GetPositionSeconds(), req.GetUnit(), req.GetTopic())
	if err != nil {
		return &pb.SaveCheckpointResponse{Success: false}, err
	}
	return &pb.SaveCheckpointResponse{Success: true}, nil
}

func (h *ContentServer) GetLastCheckpoint(ctx context.Context, req *pb.GetLastCheckpointRequest) (*pb.CheckpointResponse, error) {
	c, err := h.Playback.GetLastCheckpoint(ctx, req.GetUserId(), req.GetRecordingId())
	if err != nil {
		return nil, err
	}
	return &pb.CheckpointResponse{
		PositionSeconds: c.PositionSeconds,
		Unit:            c.Unit,
		Topic:           c.Topic,
		UpdatedAt:       timestamppb.New(c.UpdatedAt),
	}, nil
}

func (h *ContentServer) GetRecentHistory(ctx context.Context, req *pb.GetRecentHistoryRequest) (*pb.RecentHistoryResponse, error) {
	items, err := h.Playback.GetRecentHistory(ctx, req.GetUserId(), req.GetLimit())
	if err != nil {
		return nil, err
	}
	out := &pb.RecentHistoryResponse{}
	for _, it := range items {
		out.Items = append(out.Items, &pb.HistoryItem{
			RecordingId:     it.RecordingID,
			Title:           it.Title,
			CourseId:        it.CourseID,
			Unit:            it.Unit,
			Topic:           it.Topic,
			PositionSeconds: it.PositionSeconds,
			LastWatchedAt:   timestamppb.New(it.LastWatchedAt),
		})
	}
	return out, nil
}
