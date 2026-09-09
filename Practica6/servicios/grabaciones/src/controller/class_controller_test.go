package controller

import (
	"context"
	"testing"

	pb "servicio-grabaciones/proto/grabaciones"
	"servicio-grabaciones/types"
)

type classServiceMock struct {
	claseCreada   types.ClaseGrabada
	claseEditada  types.ClaseGrabada
	detalle       types.DetalleClaseGrabada
	enlace        string
	catalogo      types.CatalogoClasesResult
	busqueda      types.BusquedaAvanzadaResult
	batch         types.BatchCrearClaseResponse
	err           error
}

func (m *classServiceMock) CrearClaseGrabada(params types.CrearClaseGrabadaParams) (types.ClaseGrabada, error) {
	return m.claseCreada, m.err
}
func (m *classServiceMock) EditarClaseGrabada(params types.EditarClaseGrabadaParams) (types.ClaseGrabada, error) {
	return m.claseEditada, m.err
}
func (m *classServiceMock) EliminarClaseGrabada(idClase int32) error { return m.err }
func (m *classServiceMock) CargaMasivaClases(clases []types.ClaseCargaInput) (types.BatchCrearClaseResponse, error) {
	return m.batch, m.err
}
func (m *classServiceMock) BusquedaAvanzada(filtros types.BusquedaAvanzadaFiltros) (types.BusquedaAvanzadaResult, error) {
	return m.busqueda, m.err
}
func (m *classServiceMock) ConsultarCatalogoClases(params types.ConsultarCatalogoClasesParams) (types.CatalogoClasesResult, error) {
	return m.catalogo, m.err
}
func (m *classServiceMock) ObtenerDetalleClaseGrabada(idClase int32) (types.DetalleClaseGrabada, error) {
	return m.detalle, m.err
}
func (m *classServiceMock) ObtenerEnlaceClaseGrabada(idClase int32) (string, error) {
	return m.enlace, m.err
}

var claseBasePb = types.ClaseGrabada{
	ID: 1, IDCurso: 1, IDPeriodo: 1, IDArea: 1, Titulo: "Clase 1",
	FechaImpartida: "2025-01-15 10:00:00", DuracionMin: 60,
	URLVideo: "https://video.test", Anio: 2025, NumSemestre: 1,
}

func TestClassController_CrearClaseGrabada_Exito(t *testing.T) {
	svc := &classServiceMock{claseCreada: claseBasePb}
	ctrl := NewClassController(svc)
	resp, err := ctrl.CrearClaseGrabada(context.Background(), &pb.CrearClaseGrabadaRequest{
		IdCurso: 1, IdPeriodo: 1, IdArea: 1, Titulo: "Clase 1",
		FechaImpartida: "2025-01-15 10:00:00", DuracionMin: 60,
		UrlVideo: "https://video.test", Anio: 2025, NumSemestre: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestClassController_EditarClaseGrabada_Exito(t *testing.T) {
	svc := &classServiceMock{claseEditada: claseBasePb}
	ctrl := NewClassController(svc)
	resp, err := ctrl.EditarClaseGrabada(context.Background(), &pb.EditarClaseGrabadaRequest{
		IdClase: 1, IdCurso: 1, IdPeriodo: 1, IdArea: 1, Titulo: "Editada",
		FechaImpartida: "2025-01-15 10:00:00", DuracionMin: 60,
		UrlVideo: "https://video.test", Anio: 2025, NumSemestre: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestClassController_EliminarClaseGrabada_Exito(t *testing.T) {
	svc := &classServiceMock{}
	ctrl := NewClassController(svc)
	resp, err := ctrl.EliminarClaseGrabada(context.Background(), &pb.EliminarClaseGrabadaRequest{IdClase: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestClassController_BusquedaAvanzada_Exito(t *testing.T) {
	svc := &classServiceMock{busqueda: types.BusquedaAvanzadaResult{TotalPaginas: 1}}
	ctrl := NewClassController(svc)
	resp, err := ctrl.BusquedaAvanzada(context.Background(), &pb.BusquedaAvanzadaRequest{Anio: 2025})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestClassController_ObtenerDetalle_Exito(t *testing.T) {
	svc := &classServiceMock{detalle: types.DetalleClaseGrabada{Clase: claseBasePb}}
	ctrl := NewClassController(svc)
	resp, err := ctrl.ObtenerDetalleClaseGrabada(context.Background(), &pb.ObtenerDetalleClaseGrabadaRequest{IdClase: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestClassController_ConsultarCatalogo_Exito(t *testing.T) {
	svc := &classServiceMock{catalogo: types.CatalogoClasesResult{TotalPaginas: 1}}
	ctrl := NewClassController(svc)
	resp, err := ctrl.ConsultarCatalogoClases(context.Background(), &pb.ConsultarCatalogoClasesRequest{Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestClassController_ObtenerEnlace_Exito(t *testing.T) {
	svc := &classServiceMock{enlace: "https://video.test"}
	ctrl := NewClassController(svc)
	resp, err := ctrl.ObtenerEnlaceClaseGrabada(context.Background(), &pb.ObtenerEnlaceClaseGrabadaRequest{IdClase: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
	if resp.UrlVideo != "https://video.test" {
		t.Fatalf("esperaba URL, obtuvo %s", resp.UrlVideo)
	}
}

func TestClassController_CargaMasiva_Exito(t *testing.T) {
	svc := &classServiceMock{batch: types.BatchCrearClaseResponse{Exito: true, Mensaje: "ok"}}
	ctrl := NewClassController(svc)
	resp, err := ctrl.CargaMasivaClases(context.Background(), &pb.BatchCrearClaseRequest{
		Clases: []*pb.ClaseGrabadaInput{{IdCurso: 1, IdPeriodo: 1, IdArea: 1, Titulo: "X", FechaImpartida: "2025-01-15 10:00:00", DuracionMin: 60, UrlVideo: "https://x"}},
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestClassController_CrearClaseGrabada_Error(t *testing.T) {
	svc := &classServiceMock{err: types.NewInvalidArgumentError("campo requerido")}
	ctrl := NewClassController(svc)
	_, err := ctrl.CrearClaseGrabada(context.Background(), &pb.CrearClaseGrabadaRequest{Titulo: ""})
	if err == nil {
		t.Fatalf("esperaba error")
	}
}

func TestClassController_ConsultarCatalogo_ConRegistros(t *testing.T) {
	svc := &classServiceMock{catalogo: types.CatalogoClasesResult{
		TotalPaginas: 1,
		Registros: []types.CatalogoClase{
			{ID: 1, Titulo: "Clase 1", FechaImpartida: "2025-01-15 10:00:00",
				DuracionMin: 60, URLVideo: "https://x", Anio: 2025, NumSemestre: 1, IDCurso: 1, IDArea: 1, IDPeriodo: 1},
		},
	}}
	ctrl := NewClassController(svc)
	resp, err := ctrl.ConsultarCatalogoClases(context.Background(), &pb.ConsultarCatalogoClasesRequest{Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(resp.Registros) != 1 {
		t.Fatalf("esperaba 1 registro, obtuvo %d", len(resp.Registros))
	}
}

func TestClassController_BusquedaAvanzada_ConRegistros(t *testing.T) {
	svc := &classServiceMock{busqueda: types.BusquedaAvanzadaResult{
		TotalPaginas: 1,
		Registros: []types.ClaseBusqueda{
			{ID: 1, Titulo: "Clase 1", FechaImpartida: "2025-01-15 10:00:00",
				DuracionMin: 60, URLVideo: "https://x", Anio: 2025, NumSemestre: 1, IDCurso: 1, IDArea: 1, IDPeriodo: 1},
		},
	}}
	ctrl := NewClassController(svc)
	resp, err := ctrl.BusquedaAvanzada(context.Background(), &pb.BusquedaAvanzadaRequest{Anio: 2025})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(resp.Registros) != 1 {
		t.Fatalf("esperaba 1 registro, obtuvo %d", len(resp.Registros))
	}
}
