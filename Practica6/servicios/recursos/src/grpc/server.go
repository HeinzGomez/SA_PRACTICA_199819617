package grpc

import (
	"context"

	"servicio_recursos/controller"
	pb "servicio_recursos/proto/recursos"
)

type RecursosServer struct {
	pb.UnimplementedRecursosServiceServer
	repoCtrl  *controller.RepoController
	notesCtrl *controller.NotesController
	forumCtrl *controller.ForumController
}

func NewRecursosServer(repoCtrl *controller.RepoController, notesCtrl *controller.NotesController, forumCtrl *controller.ForumController) *RecursosServer {
	return &RecursosServer{repoCtrl: repoCtrl, notesCtrl: notesCtrl, forumCtrl: forumCtrl}
}

func (s *RecursosServer) CrearRepositorio(ctx context.Context, req *pb.CrearRepositorioRequest) (*pb.CrearRepositorioResponse, error) {
	return s.repoCtrl.CrearRepositorio(ctx, req)
}

func (s *RecursosServer) AgregarArchivo(ctx context.Context, req *pb.AgregarArchivoRequest) (*pb.AgregarArchivoResponse, error) {
	return s.repoCtrl.AgregarArchivo(ctx, req)
}

func (s *RecursosServer) ActualizarVersionArchivo(ctx context.Context, req *pb.ActualizarVersionArchivoRequest) (*pb.ActualizarVersionArchivoResponse, error) {
	return s.repoCtrl.ActualizarVersionArchivo(ctx, req)
}

func (s *RecursosServer) ActualizarTag(ctx context.Context, req *pb.ActualizarTagRequest) (*pb.ActualizarTagResponse, error) {
	return s.repoCtrl.ActualizarTag(ctx, req)
}

func (s *RecursosServer) EliminarArchivo(ctx context.Context, req *pb.EliminarArchivoRequest) (*pb.EliminarArchivoResponse, error) {
	return s.repoCtrl.EliminarArchivo(ctx, req)
}

func (s *RecursosServer) ConsultarRepositorio(ctx context.Context, req *pb.ConsultarRepositorioRequest) (*pb.ConsultarRepositorioResponse, error) {
	return s.repoCtrl.ConsultarRepositorio(ctx, req)
}

func (s *RecursosServer) ConsultarVersionesArchivo(ctx context.Context, req *pb.ConsultarVersionesArchivoRequest) (*pb.ConsultarVersionesArchivoResponse, error) {
	return s.repoCtrl.ConsultarVersionesArchivo(ctx, req)
}

func (s *RecursosServer) ConsultarVersionArchivo(ctx context.Context, req *pb.ConsultarVersionArchivoRequest) (*pb.ConsultarVersionArchivoResponse, error) {
	return s.repoCtrl.ConsultarVersionArchivo(ctx, req)
}

func (s *RecursosServer) ConsultarApunte(ctx context.Context, req *pb.ConsultarApunteRequest) (*pb.ConsultarApunteResponse, error) {
	return s.notesCtrl.ConsultarApunte(ctx, req)
}

func (s *RecursosServer) CrearApunte(ctx context.Context, req *pb.CrearApunteRequest) (*pb.CrearApunteResponse, error) {
	return s.notesCtrl.CrearApunte(ctx, req)
}

func (s *RecursosServer) ActualizarApunte(ctx context.Context, req *pb.ActualizarApunteRequest) (*pb.ActualizarApunteResponse, error) {
	return s.notesCtrl.ActualizarApunte(ctx, req)
}

func (s *RecursosServer) AgregarMarcadorTiempo(ctx context.Context, req *pb.AgregarMarcadorTiempoRequest) (*pb.AgregarMarcadorTiempoResponse, error) {
	return s.notesCtrl.AgregarMarcadorTiempo(ctx, req)
}

func (s *RecursosServer) EliminarMarcadorTiempo(ctx context.Context, req *pb.EliminarMarcadorTiempoRequest) (*pb.EliminarMarcadorTiempoResponse, error) {
	return s.notesCtrl.EliminarMarcadorTiempo(ctx, req)
}

func (s *RecursosServer) ConsultarDudasClase(ctx context.Context, req *pb.ConsultarDudasClaseRequest) (*pb.ConsultarDudasClaseResponse, error) {
	return s.forumCtrl.ConsultarDudasClase(ctx, req)
}

func (s *RecursosServer) CrearDuda(ctx context.Context, req *pb.CrearDudaRequest) (*pb.CrearDudaResponse, error) {
	return s.forumCtrl.CrearDuda(ctx, req)
}

func (s *RecursosServer) CrearRespuesta(ctx context.Context, req *pb.CrearRespuestaRequest) (*pb.CrearRespuestaResponse, error) {
	return s.forumCtrl.CrearRespuesta(ctx, req)
}

func (s *RecursosServer) MarcarRespuesta(ctx context.Context, req *pb.MarcarRespuestaRequest) (*pb.MarcarRespuestaResponse, error) {
	return s.forumCtrl.MarcarRespuesta(ctx, req)
}
