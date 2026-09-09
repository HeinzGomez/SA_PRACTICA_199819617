package grpc

import (
	"context"

	"servicio-grabaciones/controller"
	pb "servicio-grabaciones/proto/grabaciones"
)

type GrabacionesServer struct {
	pb.UnimplementedGrabacionesServiceServer
	topic    *controller.TopicController
	class    *controller.ClassController
	assign   *controller.AssignController
	log      *controller.LogController
	capitulo *controller.CapituloController
	playlist *controller.PlaylistController
}

func NewGrabacionesServer(
	topic *controller.TopicController,
	class *controller.ClassController,
	assign *controller.AssignController,
	log *controller.LogController,
	capitulo *controller.CapituloController,
	playlist *controller.PlaylistController,
) *GrabacionesServer {
	return &GrabacionesServer{
		topic:    topic,
		class:    class,
		assign:   assign,
		log:      log,
		capitulo: capitulo,
		playlist: playlist,
	}
}

func (s *GrabacionesServer) ConsultarCatalogoClases(ctx context.Context, req *pb.ConsultarCatalogoClasesRequest) (*pb.ConsultarCatalogoClasesResponse, error) {
	return s.class.ConsultarCatalogoClases(ctx, req)
}

func (s *GrabacionesServer) CrearUnidad(ctx context.Context, req *pb.CrearUnidadRequest) (*pb.CrearUnidadResponse, error) {
	return s.topic.CrearUnidad(ctx, req)
}

func (s *GrabacionesServer) EditarUnidad(ctx context.Context, req *pb.EditarUnidadRequest) (*pb.EditarUnidadResponse, error) {
	return s.topic.EditarUnidad(ctx, req)
}

func (s *GrabacionesServer) EliminarUnidad(ctx context.Context, req *pb.EliminarUnidadRequest) (*pb.EliminarUnidadResponse, error) {
	return s.topic.EliminarUnidad(ctx, req)
}

func (s *GrabacionesServer) ConsultarUnidades(ctx context.Context, req *pb.ConsultarUnidadesRequest) (*pb.ConsultarUnidadesResponse, error) {
	return s.topic.ConsultarUnidades(ctx, req)
}

func (s *GrabacionesServer) CrearTema(ctx context.Context, req *pb.CrearTemaRequest) (*pb.CrearTemaResponse, error) {
	return s.topic.CrearTema(ctx, req)
}

func (s *GrabacionesServer) EditarTema(ctx context.Context, req *pb.EditarTemaRequest) (*pb.EditarTemaResponse, error) {
	return s.topic.EditarTema(ctx, req)
}

func (s *GrabacionesServer) EliminarTema(ctx context.Context, req *pb.EliminarTemaRequest) (*pb.EliminarTemaResponse, error) {
	return s.topic.EliminarTema(ctx, req)
}

func (s *GrabacionesServer) ConsultarTemas(ctx context.Context, req *pb.ConsultarTemasRequest) (*pb.ConsultarTemasResponse, error) {
	return s.topic.ConsultarTemas(ctx, req)
}

func (s *GrabacionesServer) CrearClaseGrabada(ctx context.Context, req *pb.CrearClaseGrabadaRequest) (*pb.CrearClaseGrabadaResponse, error) {
	return s.class.CrearClaseGrabada(ctx, req)
}

func (s *GrabacionesServer) EditarClaseGrabada(ctx context.Context, req *pb.EditarClaseGrabadaRequest) (*pb.EditarClaseGrabadaResponse, error) {
	return s.class.EditarClaseGrabada(ctx, req)
}

func (s *GrabacionesServer) EliminarClaseGrabada(ctx context.Context, req *pb.EliminarClaseGrabadaRequest) (*pb.EliminarClaseGrabadaResponse, error) {
	return s.class.EliminarClaseGrabada(ctx, req)
}

func (s *GrabacionesServer) BusquedaAvanzada(ctx context.Context, req *pb.BusquedaAvanzadaRequest) (*pb.BusquedaAvanzadaResponse, error) {
	return s.class.BusquedaAvanzada(ctx, req)
}

func (s *GrabacionesServer) ObtenerDetalleClaseGrabada(ctx context.Context, req *pb.ObtenerDetalleClaseGrabadaRequest) (*pb.ObtenerDetalleClaseGrabadaResponse, error) {
	return s.class.ObtenerDetalleClaseGrabada(ctx, req)
}

func (s *GrabacionesServer) ObtenerEnlaceClaseGrabada(ctx context.Context, req *pb.ObtenerEnlaceClaseGrabadaRequest) (*pb.ObtenerEnlaceClaseGrabadaResponse, error) {
	return s.class.ObtenerEnlaceClaseGrabada(ctx, req)
}

func (s *GrabacionesServer) CargaMasivaClases(ctx context.Context, req *pb.BatchCrearClaseRequest) (*pb.BatchCrearClaseResponse, error) {
	return s.class.CargaMasivaClases(ctx, req)
}

func (s *GrabacionesServer) AsignarDocente(ctx context.Context, req *pb.AsignarDocenteRequest) (*pb.AsignarDocenteResponse, error) {
	return s.assign.AsignarDocente(ctx, req)
}

func (s *GrabacionesServer) DesasignarDocente(ctx context.Context, req *pb.DesasignarDocenteRequest) (*pb.DesasignarDocenteResponse, error) {
	return s.assign.DesasignarDocente(ctx, req)
}

func (s *GrabacionesServer) AsignarAuxiliar(ctx context.Context, req *pb.AsignarAuxiliarRequest) (*pb.AsignarAuxiliarResponse, error) {
	return s.assign.AsignarAuxiliar(ctx, req)
}

func (s *GrabacionesServer) DesasignarAuxiliar(ctx context.Context, req *pb.DesasignarAuxiliarRequest) (*pb.DesasignarAuxiliarResponse, error) {
	return s.assign.DesasignarAuxiliar(ctx, req)
}

func (s *GrabacionesServer) AsignarMaterialApoyo(ctx context.Context, req *pb.AsignarMaterialApoyoRequest) (*pb.AsignarMaterialApoyoResponse, error) {
	return s.assign.AsignarMaterialApoyo(ctx, req)
}

func (s *GrabacionesServer) DesasignarMaterialApoyo(ctx context.Context, req *pb.DesasignarMaterialApoyoRequest) (*pb.DesasignarMaterialApoyoResponse, error) {
	return s.assign.DesasignarMaterialApoyo(ctx, req)
}

func (s *GrabacionesServer) AsignarTemaClaseGrabada(ctx context.Context, req *pb.AsignarTemaClaseGrabadaRequest) (*pb.AsignarTemaClaseGrabadaResponse, error) {
	return s.assign.AsignarTemaClaseGrabada(ctx, req)
}

func (s *GrabacionesServer) DesasignarTemaClaseGrabada(ctx context.Context, req *pb.DesasignarTemaClaseGrabadaRequest) (*pb.DesasignarTemaClaseGrabadaResponse, error) {
	return s.assign.DesasignarTemaClaseGrabada(ctx, req)
}

func (s *GrabacionesServer) ConsultarParticipantesClase(ctx context.Context, req *pb.ConsultarParticipantesClaseRequest) (*pb.ConsultarParticipantesClaseResponse, error) {
	return s.assign.ConsultarParticipantesClase(ctx, req)
}

func (s *GrabacionesServer) ConsultarAuditLogs(ctx context.Context, req *pb.ConsultarAuditLogsRequest) (*pb.ConsultarAuditLogsResponse, error) {
	return s.log.ConsultarAuditLogs(ctx, req)
}

// HeinzGomez - Métodos gRPC de segmentación por capítulos
func (s *GrabacionesServer) CrearCapitulo(ctx context.Context, req *pb.CrearCapituloRequest) (*pb.CrearCapituloResponse, error) {
	return s.capitulo.CrearCapitulo(ctx, req)
}

func (s *GrabacionesServer) EditarCapitulo(ctx context.Context, req *pb.EditarCapituloRequest) (*pb.EditarCapituloResponse, error) {
	return s.capitulo.EditarCapitulo(ctx, req)
}

func (s *GrabacionesServer) EliminarCapitulo(ctx context.Context, req *pb.EliminarCapituloRequest) (*pb.EliminarCapituloResponse, error) {
	return s.capitulo.EliminarCapitulo(ctx, req)
}

func (s *GrabacionesServer) ConsultarCapitulosClase(ctx context.Context, req *pb.ConsultarCapitulosClaseRequest) (*pb.ConsultarCapitulosClaseResponse, error) {
	return s.capitulo.ConsultarCapitulosClase(ctx, req)
}

func (s *GrabacionesServer) ConsultarPlaylistsUsuario(ctx context.Context, req *pb.ConsultarPlaylistsUsuarioRequest) (*pb.ConsultarPlaylistsUsuarioResponse, error) {
	return s.playlist.ConsultarPlaylistsUsuario(ctx, req)
}

func (s *GrabacionesServer) ConsultarPlaylistPorHash(ctx context.Context, req *pb.ConsultarPlaylistPorHashRequest) (*pb.ConsultarPlaylistPorHashResponse, error) {
	return s.playlist.ConsultarPlaylistPorHash(ctx, req)
}

func (s *GrabacionesServer) ConsultarVideosPlaylist(ctx context.Context, req *pb.ConsultarVideosPlaylistRequest) (*pb.ConsultarVideosPlaylistResponse, error) {
	return s.playlist.ConsultarVideosPlaylist(ctx, req)
}

func (s *GrabacionesServer) ConsultarVideosPlaylistPorHash(ctx context.Context, req *pb.ConsultarVideosPlaylistPorHashRequest) (*pb.ConsultarVideosPlaylistPorHashResponse, error) {
	return s.playlist.ConsultarVideosPlaylistPorHash(ctx, req)
}

func (s *GrabacionesServer) CrearPlaylist(ctx context.Context, req *pb.CrearPlaylistRequest) (*pb.CrearPlaylistResponse, error) {
	return s.playlist.CrearPlaylist(ctx, req)
}

func (s *GrabacionesServer) EliminarPlaylist(ctx context.Context, req *pb.EliminarPlaylistRequest) (*pb.EliminarPlaylistResponse, error) {
	return s.playlist.EliminarPlaylist(ctx, req)
}

func (s *GrabacionesServer) CambiarVisibilidadPlaylist(ctx context.Context, req *pb.CambiarVisibilidadPlaylistRequest) (*pb.CambiarVisibilidadPlaylistResponse, error) {
	return s.playlist.CambiarVisibilidadPlaylist(ctx, req)
}

func (s *GrabacionesServer) AgregarVideoPlaylist(ctx context.Context, req *pb.AgregarVideoPlaylistRequest) (*pb.AgregarVideoPlaylistResponse, error) {
	return s.playlist.AgregarVideoPlaylist(ctx, req)
}

func (s *GrabacionesServer) EliminarVideoPlaylist(ctx context.Context, req *pb.EliminarVideoPlaylistRequest) (*pb.EliminarVideoPlaylistResponse, error) {
	return s.playlist.EliminarVideoPlaylist(ctx, req)
}

func (s *GrabacionesServer) GenerarLinkPlaylist(ctx context.Context, req *pb.GenerarLinkPlaylistRequest) (*pb.GenerarLinkPlaylistResponse, error) {
	return s.playlist.GenerarLinkPlaylist(ctx, req)
}
