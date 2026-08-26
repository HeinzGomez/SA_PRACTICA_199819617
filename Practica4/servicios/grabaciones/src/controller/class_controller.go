package controller

import (
	"context"

	pb "servicio-grabaciones/proto/grabaciones"
	"servicio-grabaciones/services"
	"servicio-grabaciones/types"
)

type ClassController struct {
	classService services.ClassService
}

func NewClassController(classService services.ClassService) *ClassController {
	return &ClassController{classService: classService}
}

func (c *ClassController) CrearClaseGrabada(ctx context.Context, req *pb.CrearClaseGrabadaRequest) (*pb.CrearClaseGrabadaResponse, error) {
	clase, err := c.classService.CrearClaseGrabada(types.CrearClaseGrabadaParams{
		IDCurso:        req.GetIdCurso(),
		IDPeriodo:      req.GetIdPeriodo(),
		IDArea:         req.GetIdArea(),
		Titulo:         req.GetTitulo(),
		FechaImpartida: req.GetFechaImpartida(),
		DuracionMin:    req.GetDuracionMin(),
		Descripcion:    strPtr(req.GetDescripcion()),
		URLVideo:       req.GetUrlVideo(),
		Anio:           req.GetAnio(),
		NumSemestre:    req.GetNumSemestre(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.CrearClaseGrabadaResponse{
		Exito:   true,
		Mensaje: "Clase grabada registrada exitosamente",
		Clase:   mapClaseGrabada(clase),
	}, nil
}

func (c *ClassController) EditarClaseGrabada(ctx context.Context, req *pb.EditarClaseGrabadaRequest) (*pb.EditarClaseGrabadaResponse, error) {
	clase, err := c.classService.EditarClaseGrabada(types.EditarClaseGrabadaParams{
		ID:             req.GetIdClase(),
		IDCurso:        req.GetIdCurso(),
		IDPeriodo:      req.GetIdPeriodo(),
		IDArea:         req.GetIdArea(),
		Titulo:         req.GetTitulo(),
		FechaImpartida: req.GetFechaImpartida(),
		DuracionMin:    req.GetDuracionMin(),
		Descripcion:    strPtr(req.GetDescripcion()),
		URLVideo:       req.GetUrlVideo(),
		Anio:           req.GetAnio(),
		NumSemestre:    req.GetNumSemestre(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.EditarClaseGrabadaResponse{
		Exito:   true,
		Mensaje: "Clase grabada actualizada exitosamente",
		Clase:   mapClaseGrabada(clase),
	}, nil
}

func (c *ClassController) EliminarClaseGrabada(ctx context.Context, req *pb.EliminarClaseGrabadaRequest) (*pb.EliminarClaseGrabadaResponse, error) {
	err := c.classService.EliminarClaseGrabada(req.GetIdClase())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.EliminarClaseGrabadaResponse{
		Exito:   true,
		Mensaje: "Clase grabada eliminada exitosamente",
	}, nil
}

func (c *ClassController) BusquedaAvanzada(ctx context.Context, req *pb.BusquedaAvanzadaRequest) (*pb.BusquedaAvanzadaResponse, error) {
	result, err := c.classService.BusquedaAvanzada(types.BusquedaAvanzadaFiltros{
		Anio:      req.GetAnio(),
		Semestre:  req.GetSemestre(),
		IDArea:    req.GetIdArea(),
		IDCurso:   req.GetIdCurso(),
		IDDocente: req.GetIdDocente(),
		IDTema:    req.GetIdTema(),
		Pagina:    req.GetPagina(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}

	registros := make([]*pb.CatalogoClase, 0, len(result.Registros))
	for _, clase := range result.Registros {
		registros = append(registros, mapCatalogoClase(clase))
	}

	return &pb.BusquedaAvanzadaResponse{
		Exito:        true,
		Mensaje:      "Búsqueda avanzada realizada exitosamente",
		Registros:    registros,
		TotalPaginas: result.TotalPaginas,
	}, nil
}

func (c *ClassController) ObtenerDetalleClaseGrabada(ctx context.Context, req *pb.ObtenerDetalleClaseGrabadaRequest) (*pb.ObtenerDetalleClaseGrabadaResponse, error) {
	detalle, err := c.classService.ObtenerDetalleClaseGrabada(req.GetIdClase())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.ObtenerDetalleClaseGrabadaResponse{
		Exito:   true,
		Mensaje: "Detalle de la clase grabada consultado exitosamente",
		Detalle: mapDetalleClaseGrabada(detalle),
	}, nil
}

func (c *ClassController) ConsultarCatalogoClases(ctx context.Context, req *pb.ConsultarCatalogoClasesRequest) (*pb.ConsultarCatalogoClasesResponse, error) {
	result, err := c.classService.ConsultarCatalogoClases(types.ConsultarCatalogoClasesParams{
		Pagina: req.GetPagina(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}

	registros := make([]*pb.CatalogoClase, 0, len(result.Registros))
	for _, clase := range result.Registros {
		registros = append(registros, mapCatalogoClaseCompleto(clase))
	}

	return &pb.ConsultarCatalogoClasesResponse{
		Exito:        true,
		Mensaje:      "Catálogo de clases consultado exitosamente",
		Registros:    registros,
		TotalPaginas: result.TotalPaginas,
	}, nil
}

func (c *ClassController) ObtenerEnlaceClaseGrabada(ctx context.Context, req *pb.ObtenerEnlaceClaseGrabadaRequest) (*pb.ObtenerEnlaceClaseGrabadaResponse, error) {
	urlVideo, err := c.classService.ObtenerEnlaceClaseGrabada(req.GetIdClase())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.ObtenerEnlaceClaseGrabadaResponse{
		Exito:    true,
		Mensaje:  "Enlace de la clase grabada obtenido exitosamente",
		UrlVideo: urlVideo,
	}, nil
}

func (c *ClassController) CargaMasivaClases(ctx context.Context, req *pb.BatchCrearClaseRequest) (*pb.BatchCrearClaseResponse, error) {
	// Map proto items to internal types
	items := make([]types.ClaseCargaInput, 0, len(req.GetClases()))
	for _, it := range req.GetClases() {
		var urlPtr *string
		if it.GetUrlVideo() != "" {
			u := it.GetUrlVideo()
			urlPtr = &u
		}
		var descPtr *string
		if it.GetDescripcion() != "" {
			d := it.GetDescripcion()
			descPtr = &d
		}
		var anioPtr *int32
		if it.GetAnio() != 0 {
			a := it.GetAnio()
			anioPtr = &a
		}
		var semestrePtr *int32
		if it.GetNumSemestre() != 0 {
			s := it.GetNumSemestre()
			semestrePtr = &s
		}
		items = append(items, types.ClaseCargaInput{
			IDCurso:        it.GetIdCurso(),
			IDPeriodo:      it.GetIdPeriodo(),
			IDArea:         it.GetIdArea(),
			Titulo:         it.GetTitulo(),
			FechaImpartida: it.GetFechaImpartida(),
			DuracionMin:    it.GetDuracionMin(),
			Descripcion:    descPtr,
			URLVideo:       urlPtr,
			Anio:           anioPtr,
			NumSemestre:    semestrePtr,
		})
	}

	resp, err := c.classService.CargaMasivaClases(items)
	if err != nil {
		return nil, toGrpcError(err)
	}

	resultados := make([]*pb.BatchCrearClaseResult, 0, len(resp.Resultados))
	for _, r := range resp.Resultados {
		var mensaje string
		if r.Message != nil {
			mensaje = *r.Message
		}
		var idClase int32
		if r.IDClase != nil {
			idClase = *r.IDClase
		}
		resultados = append(resultados, &pb.BatchCrearClaseResult{
			Index:  r.Index,
			Exito:  r.Status == "ok",
			Mensaje: mensaje,
			IdClase: idClase,
		})
	}

	return &pb.BatchCrearClaseResponse{
		Exito:      resp.Exito,
		Mensaje:    resp.Mensaje,
		Resultados: resultados,
	}, nil
}

func mapClaseGrabada(clase types.ClaseGrabada) *pb.ClaseGrabada {
	return &pb.ClaseGrabada{
		IdClase:        clase.ID,
		IdCurso:        clase.IDCurso,
		IdPeriodo:      clase.IDPeriodo,
		IdArea:         clase.IDArea,
		Titulo:         clase.Titulo,
		FechaImpartida: clase.FechaImpartida,
		DuracionMin:    clase.DuracionMin,
		Descripcion:    strVal(clase.Descripcion),
		UrlVideo:       clase.URLVideo,
		Anio:           clase.Anio,
		NumSemestre:    clase.NumSemestre,
	}
}

func mapCatalogoClase(clase types.ClaseBusqueda) *pb.CatalogoClase {
	return &pb.CatalogoClase{
		IdClase:        clase.ID,
		Titulo:         clase.Titulo,
		Descripcion:    strVal(clase.Descripcion),
		FechaImpartida: clase.FechaImpartida,
		DuracionMin:    clase.DuracionMin,
		UrlVideo:       clase.URLVideo,
		Anio:           clase.Anio,
		NumSemestre:    clase.NumSemestre,
		IdCurso:        clase.IDCurso,
		IdArea:         clase.IDArea,
		IdPeriodo:      clase.IDPeriodo,
	}
}

func mapCatalogoClaseCompleto(clase types.CatalogoClase) *pb.CatalogoClase {
	return &pb.CatalogoClase{
		IdClase:        clase.ID,
		Titulo:         clase.Titulo,
		Descripcion:    strVal(clase.Descripcion),
		FechaImpartida: clase.FechaImpartida,
		DuracionMin:    clase.DuracionMin,
		UrlVideo:       clase.URLVideo,
		Anio:           clase.Anio,
		NumSemestre:    clase.NumSemestre,
		IdCurso:        clase.IDCurso,
		IdArea:         clase.IDArea,
		IdPeriodo:      clase.IDPeriodo,
	}
}

func mapDetalleClaseGrabada(detalle types.DetalleClaseGrabada) *pb.DetalleClaseGrabada {
	det := &pb.DetalleClaseGrabada{
		Clase:         mapClaseGrabada(detalle.Clase),
		Temas:         make([]*pb.Tema, 0, len(detalle.Temas)),
		Materiales:    make([]*pb.MaterialApoyo, 0, len(detalle.Materiales)),
		Participantes: make([]*pb.Participante, 0, len(detalle.Participantes)),
	}

	for _, tema := range detalle.Temas {
		det.Temas = append(det.Temas, &pb.Tema{
			IdTema:   tema.ID,
			IdUnidad: tema.UnidadID,
			Nombre:   tema.Nombre,
			Unidad:   strVal(tema.Unidad),
		})
	}

	for _, material := range detalle.Materiales {
		det.Materiales = append(det.Materiales, &pb.MaterialApoyo{
			IdMaterial: material.ID,
			IdClase:    material.IDClase,
			Nombre:     material.Nombre,
			Tipo:       material.Tipo,
			Url:        material.URL,
		})
	}

	for _, participante := range detalle.Participantes {
		det.Participantes = append(det.Participantes, &pb.Participante{
			IdClase:          participante.IDClase,
			IdUsuario:        participante.IDUsuario,
			TipoParticipante: participante.TipoParticipante,
		})
	}

	return det
}

func strVal(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func strPtr(value string) *string {
	return &value
}
