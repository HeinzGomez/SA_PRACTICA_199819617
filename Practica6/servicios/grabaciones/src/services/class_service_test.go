package services

import (
	"database/sql"
	"errors"
	"testing"

	"servicio-grabaciones/types"
)

type classRepoForClassSvc struct {
	claseCreada      types.ClaseGrabada
	claseEditada     types.ClaseGrabada
	clasePorId       types.ClaseGrabada
	clasePorIdErr    error
	eliminarErr      error
	editarErr        error
	crearErr         error
	fichas           []types.FichaTecnicaRow
	fichasErr        error
	enlace           string
	enlaceErr        error
	catalogo         types.CatalogoClasesResult
	catalogoErr      error
	busqueda         types.BusquedaAvanzadaResult
	busquedaErr      error
	cargaJSON        string
	cargaErr         error
}

func (m *classRepoForClassSvc) CrearClaseGrabada(params types.CrearClaseGrabadaParams) (types.ClaseGrabada, error) {
	return m.claseCreada, m.crearErr
}
func (m *classRepoForClassSvc) EditarClaseGrabada(params types.EditarClaseGrabadaParams) (types.ClaseGrabada, error) {
	return m.claseEditada, m.editarErr
}
func (m *classRepoForClassSvc) EliminarClaseGrabada(idClase int32) error {
	return m.eliminarErr
}
func (m *classRepoForClassSvc) BuscarClaseGrabada(idClase int32) (types.ClaseGrabada, error) {
	return m.clasePorId, m.clasePorIdErr
}
func (m *classRepoForClassSvc) ConsultarCatalogoClases(params types.ConsultarCatalogoClasesParams) (types.CatalogoClasesResult, error) {
	return m.catalogo, m.catalogoErr
}
func (m *classRepoForClassSvc) BusquedaAvanzada(filtros types.BusquedaAvanzadaFiltros) (types.BusquedaAvanzadaResult, error) {
	return m.busqueda, m.busquedaErr
}
func (m *classRepoForClassSvc) ConsultarFichaTecnica(idClase int32) ([]types.FichaTecnicaRow, error) {
	return m.fichas, m.fichasErr
}
func (m *classRepoForClassSvc) ObtenerEnlaceClaseGrabada(idClase int32) (string, error) {
	return m.enlace, m.enlaceErr
}
func (m *classRepoForClassSvc) CargaMasivaClases(pClasesJSON string) (string, error) {
	return m.cargaJSON, m.cargaErr
}

type assignRepoForClassSvc struct {
	participantes []types.Participante
	partErr       error
}

func (m *assignRepoForClassSvc) AsignarDocente(params types.AsignarDocenteParams) error { return nil }
func (m *assignRepoForClassSvc) AsignarAuxiliar(params types.AsignarAuxiliarParams) error { return nil }
func (m *assignRepoForClassSvc) AsignarMaterialApoyo(params types.AsignarMaterialApoyoParams) (types.MaterialApoyo, error) {
	return types.MaterialApoyo{}, nil
}
func (m *assignRepoForClassSvc) AsignarTemaClaseGrabada(params types.AsignarTemaClaseParams) error {
	return nil
}
func (m *assignRepoForClassSvc) DesasignarDocente(params types.DesasignarDocenteParams) error {
	return nil
}
func (m *assignRepoForClassSvc) DesasignarAuxiliar(params types.DesasignarAuxiliarParams) error {
	return nil
}
func (m *assignRepoForClassSvc) DesasignarMaterialApoyo(params types.DesasignarMaterialApoyoParams) error {
	return nil
}
func (m *assignRepoForClassSvc) DesasignarTemaClaseGrabada(params types.DesasignarTemaClaseParams) error {
	return nil
}
func (m *assignRepoForClassSvc) ConsultarParticipantesClase(idClase int32) ([]types.Participante, error) {
	return m.participantes, m.partErr
}

var claseBaseSvc = types.ClaseGrabada{
	ID: 1, IDCurso: 1, IDPeriodo: 1, IDArea: 1, Titulo: "Clase 1",
	FechaImpartida: "2025-01-15 10:00:00", DuracionMin: 60,
	URLVideo: "https://video.test", Anio: 2025, NumSemestre: 1,
}

var paramsValidosSvc = types.CrearClaseGrabadaParams{
	IDCurso: 1, IDPeriodo: 1, IDArea: 1, Titulo: "Clase 1",
	FechaImpartida: "2025-01-15 10:00:00", DuracionMin: 60,
	URLVideo: "https://video.test", Anio: 2025, NumSemestre: 1,
}

func TestCrearClaseGrabadaSvc_Exito(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{claseCreada: claseBaseSvc}, &assignRepoForClassSvc{})
	result, err := svc.CrearClaseGrabada(paramsValidosSvc)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestCrearClaseGrabadaSvc_IDCursoCero(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	p := paramsValidosSvc
	p.IDCurso = 0
	_, err := svc.CrearClaseGrabada(p)
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestCrearClaseGrabadaSvc_IDPeriodoCero(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	p := paramsValidosSvc
	p.IDPeriodo = 0
	_, err := svc.CrearClaseGrabada(p)
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestCrearClaseGrabadaSvc_IDAreaCero(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	p := paramsValidosSvc
	p.IDArea = 0
	_, err := svc.CrearClaseGrabada(p)
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestCrearClaseGrabadaSvc_TituloVacio(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	p := paramsValidosSvc
	p.Titulo = ""
	_, err := svc.CrearClaseGrabada(p)
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestCrearClaseGrabadaSvc_DuracionCero(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	p := paramsValidosSvc
	p.DuracionMin = 0
	_, err := svc.CrearClaseGrabada(p)
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestCrearClaseGrabadaSvc_URLVacia(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	p := paramsValidosSvc
	p.URLVideo = ""
	_, err := svc.CrearClaseGrabada(p)
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestCrearClaseGrabadaSvc_AnioCero(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	p := paramsValidosSvc
	p.Anio = 0
	_, err := svc.CrearClaseGrabada(p)
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestCrearClaseGrabadaSvc_SemestreInvalido(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	p := paramsValidosSvc
	p.NumSemestre = 3
	_, err := svc.CrearClaseGrabada(p)
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestCrearClaseGrabadaSvc_FechaFormatoInvalido(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	p := paramsValidosSvc
	p.FechaImpartida = "15-01-2025"
	_, err := svc.CrearClaseGrabada(p)
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestCrearClaseGrabadaSvc_RepoError(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{crearErr: errors.New("db")}, &assignRepoForClassSvc{})
	_, err := svc.CrearClaseGrabada(paramsValidosSvc)
	if !esInternal(err) {
		t.Fatalf("esperaba Internal, obtuvo: %v", err)
	}
}

func TestEditarClaseGrabadaSvc_Exito(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{clasePorId: claseBaseSvc, claseEditada: claseBaseSvc}, &assignRepoForClassSvc{})
	p := types.EditarClaseGrabadaParams{
		ID: 1, IDCurso: 1, IDPeriodo: 1, IDArea: 1, Titulo: "Editada",
		FechaImpartida: "2025-01-15 10:00:00", DuracionMin: 60,
		URLVideo: "https://video.test", Anio: 2025, NumSemestre: 1,
	}
	result, err := svc.EditarClaseGrabada(p)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestEditarClaseGrabadaSvc_IDCero(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	_, err := svc.EditarClaseGrabada(types.EditarClaseGrabadaParams{ID: 0})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestEditarClaseGrabadaSvc_NoExiste(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{clasePorIdErr: sql.ErrNoRows}, &assignRepoForClassSvc{})
	_, err := svc.EditarClaseGrabada(types.EditarClaseGrabadaParams{ID: 99, IDCurso: 1, IDPeriodo: 1, IDArea: 1, Titulo: "X", FechaImpartida: "2025-01-15 10:00:00", DuracionMin: 60, URLVideo: "https://x", Anio: 2025, NumSemestre: 1})
	if !esNotFound(err) {
		t.Fatalf("esperaba NotFound, obtuvo: %v", err)
	}
}

func TestEliminarClaseGrabadaSvc_Exito(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	if err := svc.EliminarClaseGrabada(1); err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestEliminarClaseGrabadaSvc_IDCero(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	if err := svc.EliminarClaseGrabada(0); !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestEliminarClaseGrabadaSvc_NoExiste(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{eliminarErr: sql.ErrNoRows}, &assignRepoForClassSvc{})
	if err := svc.EliminarClaseGrabada(99); !esNotFound(err) {
		t.Fatalf("esperaba NotFound, obtuvo: %v", err)
	}
}

func TestBusquedaAvanzadaSvc_Exito(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{busqueda: types.BusquedaAvanzadaResult{TotalPaginas: 1}}, &assignRepoForClassSvc{})
	_, err := svc.BusquedaAvanzada(types.BusquedaAvanzadaFiltros{Anio: 2025})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestBusquedaAvanzadaSvc_FiltroNegativo(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	_, err := svc.BusquedaAvanzada(types.BusquedaAvanzadaFiltros{Anio: -1})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestBusquedaAvanzadaSvc_SemestreInvalido(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	_, err := svc.BusquedaAvanzada(types.BusquedaAvanzadaFiltros{Semestre: 3})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestConsultarCatalogoClasesSvc_Exito(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{catalogo: types.CatalogoClasesResult{TotalPaginas: 1}}, &assignRepoForClassSvc{})
	_, err := svc.ConsultarCatalogoClases(types.ConsultarCatalogoClasesParams{Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestObtenerDetalleClaseGrabadaSvc_Exito(t *testing.T) {
	classRepo := &classRepoForClassSvc{
		clasePorId: claseBaseSvc,
		fichas:     []types.FichaTecnicaRow{{ClaseID: 1, TemaID: int32PtrSvc(1), UnidadID: int32PtrSvc(1), Tema: strPtrSvc("Tema 1"), Unidad: strPtrSvc("Unidad 1"), MaterialID: int32PtrSvc(1), Material: strPtrSvc("Mat 1"), Tipo: strPtrSvc("PDF"), MaterialURL: strPtrSvc("url")}},
	}
	assignRepo := &assignRepoForClassSvc{participantes: []types.Participante{{IDClase: 1, IDUsuario: 1, TipoParticipante: "DOCENTE"}}}
	svc := NewClassService(classRepo, assignRepo)
	result, err := svc.ObtenerDetalleClaseGrabada(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Temas) != 1 {
		t.Fatalf("esperaba 1 tema, obtuvo %d", len(result.Temas))
	}
	if len(result.Materiales) != 1 {
		t.Fatalf("esperaba 1 material, obtuvo %d", len(result.Materiales))
	}
	if len(result.Participantes) != 1 {
		t.Fatalf("esperaba 1 participante, obtuvo %d", len(result.Participantes))
	}
}

func TestObtenerDetalleClaseGrabadaSvc_IDCero(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	_, err := svc.ObtenerDetalleClaseGrabada(0)
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestObtenerDetalleClaseGrabadaSvc_NoExiste(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{clasePorIdErr: sql.ErrNoRows}, &assignRepoForClassSvc{})
	_, err := svc.ObtenerDetalleClaseGrabada(99)
	if !esNotFound(err) {
		t.Fatalf("esperaba NotFound, obtuvo: %v", err)
	}
}

func TestObtenerEnlaceClaseGrabadaSvc_Exito(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{enlace: "https://video.test"}, &assignRepoForClassSvc{})
	result, err := svc.ObtenerEnlaceClaseGrabada(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result != "https://video.test" {
		t.Fatalf("esperaba URL, obtuvo %s", result)
	}
}

func TestObtenerEnlaceClaseGrabadaSvc_IDCero(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	_, err := svc.ObtenerEnlaceClaseGrabada(0)
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestCargaMasivaClasesSvc_Exito(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{cargaJSON: `[{"index":0,"status":"ok"}]`}, &assignRepoForClassSvc{})
		input := []types.ClaseCargaInput{{IDCurso: 1, IDPeriodo: 1, IDArea: 1, Titulo: "X", FechaImpartida: "2025-01-15 10:00:00", DuracionMin: 60, URLVideo: strPtrSvc("https://x"), Anio: int32PtrSvc(2025), NumSemestre: int32PtrSvc(1)}}
	result, err := svc.CargaMasivaClases(input)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !result.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestCargaMasivaClasesSvc_ListaVacia(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	_, err := svc.CargaMasivaClases([]types.ClaseCargaInput{})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestAgruparTemasSvc_Vacios(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	result := svc.agruparTemas([]types.FichaTecnicaRow{})
	if len(result) != 0 {
		t.Fatalf("esperaba 0 temas, obtuvo %d", len(result))
	}
}

func TestAgruparMaterialesSvc_Vacios(t *testing.T) {
	svc := NewClassService(&classRepoForClassSvc{}, &assignRepoForClassSvc{})
	result := svc.agruparMateriales([]types.FichaTecnicaRow{}, 1)
	if len(result) != 0 {
		t.Fatalf("esperaba 0 materiales, obtuvo %d", len(result))
	}
}

func int32PtrSvc(v int32) *int32 { return &v }
func strPtrSvc(s string) *string  { return &s }
