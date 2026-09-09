package services

import (
	"database/sql"
	"errors"
	"testing"

	"servicio-grabaciones/types"
)

type assignRepoForAssignSvc struct {
	asignarDocenteErr    error
	asignarAuxiliarErr   error
	materialCreado       types.MaterialApoyo
	asignarMaterialErr   error
	asignarTemaErr       error
	desasignarDocenteErr error
	desasignarAuxErr     error
	desasignarMatErr     error
	desasignarTemaErr    error
	participantes        []types.Participante
	participantesErr     error
}

func (m *assignRepoForAssignSvc) AsignarDocente(params types.AsignarDocenteParams) error {
	return m.asignarDocenteErr
}
func (m *assignRepoForAssignSvc) AsignarAuxiliar(params types.AsignarAuxiliarParams) error {
	return m.asignarAuxiliarErr
}
func (m *assignRepoForAssignSvc) AsignarMaterialApoyo(params types.AsignarMaterialApoyoParams) (types.MaterialApoyo, error) {
	return m.materialCreado, m.asignarMaterialErr
}
func (m *assignRepoForAssignSvc) AsignarTemaClaseGrabada(params types.AsignarTemaClaseParams) error {
	return m.asignarTemaErr
}
func (m *assignRepoForAssignSvc) DesasignarDocente(params types.DesasignarDocenteParams) error {
	return m.desasignarDocenteErr
}
func (m *assignRepoForAssignSvc) DesasignarAuxiliar(params types.DesasignarAuxiliarParams) error {
	return m.desasignarAuxErr
}
func (m *assignRepoForAssignSvc) DesasignarMaterialApoyo(params types.DesasignarMaterialApoyoParams) error {
	return m.desasignarMatErr
}
func (m *assignRepoForAssignSvc) DesasignarTemaClaseGrabada(params types.DesasignarTemaClaseParams) error {
	return m.desasignarTemaErr
}
func (m *assignRepoForAssignSvc) ConsultarParticipantesClase(idClase int32) ([]types.Participante, error) {
	return m.participantes, m.participantesErr
}

type classRepoForAssignSvc struct {
	clasePorId    types.ClaseGrabada
	clasePorIdErr error
	fichas        []types.FichaTecnicaRow
	fichasErr     error
}

func (m *classRepoForAssignSvc) CrearClaseGrabada(params types.CrearClaseGrabadaParams) (types.ClaseGrabada, error) {
	return types.ClaseGrabada{}, nil
}
func (m *classRepoForAssignSvc) EditarClaseGrabada(params types.EditarClaseGrabadaParams) (types.ClaseGrabada, error) {
	return types.ClaseGrabada{}, nil
}
func (m *classRepoForAssignSvc) EliminarClaseGrabada(idClase int32) error { return nil }
func (m *classRepoForAssignSvc) BuscarClaseGrabada(idClase int32) (types.ClaseGrabada, error) {
	return m.clasePorId, m.clasePorIdErr
}
func (m *classRepoForAssignSvc) ConsultarCatalogoClases(params types.ConsultarCatalogoClasesParams) (types.CatalogoClasesResult, error) {
	return types.CatalogoClasesResult{}, nil
}
func (m *classRepoForAssignSvc) BusquedaAvanzada(filtros types.BusquedaAvanzadaFiltros) (types.BusquedaAvanzadaResult, error) {
	return types.BusquedaAvanzadaResult{}, nil
}
func (m *classRepoForAssignSvc) ConsultarFichaTecnica(idClase int32) ([]types.FichaTecnicaRow, error) {
	return m.fichas, m.fichasErr
}
func (m *classRepoForAssignSvc) ObtenerEnlaceClaseGrabada(idClase int32) (string, error) { return "", nil }
func (m *classRepoForAssignSvc) CargaMasivaClases(pClasesJSON string) (string, error)    { return "", nil }

type topicRepoForAssignSvc struct {
	temaPorId    types.Tema
	temaPorIdErr error
}

func (m *topicRepoForAssignSvc) CrearUnidad(params types.CrearUnidadParams) (types.Unidad, error) {
	return types.Unidad{}, nil
}
func (m *topicRepoForAssignSvc) EditarUnidad(params types.EditarUnidadParams) (types.Unidad, error) {
	return types.Unidad{}, nil
}
func (m *topicRepoForAssignSvc) EliminarUnidad(idUnidad int32) error          { return nil }
func (m *topicRepoForAssignSvc) BuscarUnidadPorId(idUnidad int32) (types.Unidad, error) {
	return types.Unidad{}, nil
}
func (m *topicRepoForAssignSvc) ConsultarUnidades() ([]types.Unidad, error) { return nil, nil }
func (m *topicRepoForAssignSvc) ContarTemasPorUnidad(idUnidad int32) (int64, error) {
	return 0, nil
}
func (m *topicRepoForAssignSvc) CrearTema(params types.CrearTemaParams) (types.Tema, error) {
	return types.Tema{}, nil
}
func (m *topicRepoForAssignSvc) EditarTema(params types.EditarTemaParams) (types.Tema, error) {
	return types.Tema{}, nil
}
func (m *topicRepoForAssignSvc) EliminarTema(idTema int32) error { return nil }
func (m *topicRepoForAssignSvc) BuscarTemaPorId(idTema int32) (types.Tema, error) {
	return m.temaPorId, m.temaPorIdErr
}
func (m *topicRepoForAssignSvc) ConsultarTemas(idUnidad int32) ([]types.Tema, error) {
	return nil, nil
}

func TestAsignarDocenteSvc_Exito(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{participantes: []types.Participante{}}, &classRepoForAssignSvc{clasePorId: claseBaseSvc}, &topicRepoForAssignSvc{})
	err := svc.AsignarDocente(types.AsignarDocenteParams{IDClase: 1, IDUsuario: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestAsignarDocenteSvc_IDClaseCero(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	err := svc.AsignarDocente(types.AsignarDocenteParams{IDClase: 0, IDUsuario: 1})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestAsignarDocenteSvc_IDUsuarioCero(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	err := svc.AsignarDocente(types.AsignarDocenteParams{IDClase: 1, IDUsuario: 0})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestAsignarDocenteSvc_ClaseNoExiste(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{clasePorIdErr: sql.ErrNoRows}, &topicRepoForAssignSvc{})
	err := svc.AsignarDocente(types.AsignarDocenteParams{IDClase: 99, IDUsuario: 1})
	if !esNotFound(err) {
		t.Fatalf("esperaba NotFound, obtuvo: %v", err)
	}
}

func TestAsignarDocenteSvc_YaAsignado(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{participantes: []types.Participante{{IDClase: 1, IDUsuario: 1, TipoParticipante: "DOCENTE"}}}, &classRepoForAssignSvc{clasePorId: claseBaseSvc}, &topicRepoForAssignSvc{})
	err := svc.AsignarDocente(types.AsignarDocenteParams{IDClase: 1, IDUsuario: 1})
	if !esAlreadyExists(err) {
		t.Fatalf("esperaba AlreadyExists, obtuvo: %v", err)
	}
}

func TestAsignarAuxiliarSvc_Exito(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{participantes: []types.Participante{}}, &classRepoForAssignSvc{clasePorId: claseBaseSvc}, &topicRepoForAssignSvc{})
	err := svc.AsignarAuxiliar(types.AsignarAuxiliarParams{IDClase: 1, IDUsuario: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestAsignarAuxiliarSvc_YaAsignado(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{participantes: []types.Participante{{IDClase: 1, IDUsuario: 1, TipoParticipante: "AUXILIAR"}}}, &classRepoForAssignSvc{clasePorId: claseBaseSvc}, &topicRepoForAssignSvc{})
	err := svc.AsignarAuxiliar(types.AsignarAuxiliarParams{IDClase: 1, IDUsuario: 1})
	if !esAlreadyExists(err) {
		t.Fatalf("esperaba AlreadyExists, obtuvo: %v", err)
	}
}

func TestAsignarMaterialApoyoSvc_Exito(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{materialCreado: types.MaterialApoyo{ID: 1, Nombre: "PDF"}}, &classRepoForAssignSvc{clasePorId: claseBaseSvc}, &topicRepoForAssignSvc{})
	result, err := svc.AsignarMaterialApoyo(types.AsignarMaterialApoyoParams{IDClase: 1, Nombre: "PDF", Tipo: "Documento", URL: "https://x"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestAsignarMaterialApoyoSvc_NombreVacio(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	_, err := svc.AsignarMaterialApoyo(types.AsignarMaterialApoyoParams{IDClase: 1, Nombre: "", Tipo: "X", URL: "https://x"})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestAsignarMaterialApoyoSvc_TipoVacio(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	_, err := svc.AsignarMaterialApoyo(types.AsignarMaterialApoyoParams{IDClase: 1, Nombre: "X", Tipo: "", URL: "https://x"})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestAsignarMaterialApoyoSvc_URLVacia(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	_, err := svc.AsignarMaterialApoyo(types.AsignarMaterialApoyoParams{IDClase: 1, Nombre: "X", Tipo: "Y", URL: ""})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestAsignarTemaClaseGrabadaSvc_Exito(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{clasePorId: claseBaseSvc, fichas: []types.FichaTecnicaRow{}}, &topicRepoForAssignSvc{temaPorId: types.Tema{ID: 1}})
	err := svc.AsignarTemaClaseGrabada(types.AsignarTemaClaseParams{IDClase: 1, IDTema: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestAsignarTemaClaseGrabadaSvc_TemaNoExiste(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{clasePorId: claseBaseSvc}, &topicRepoForAssignSvc{temaPorIdErr: sql.ErrNoRows})
	err := svc.AsignarTemaClaseGrabada(types.AsignarTemaClaseParams{IDClase: 1, IDTema: 99})
	if !esNotFound(err) {
		t.Fatalf("esperaba NotFound, obtuvo: %v", err)
	}
}

func TestAsignarTemaClaseGrabadaSvc_YaAsociado(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{clasePorId: claseBaseSvc, fichas: []types.FichaTecnicaRow{{TemaID: int32PtrSvc(1)}}}, &topicRepoForAssignSvc{temaPorId: types.Tema{ID: 1}})
	err := svc.AsignarTemaClaseGrabada(types.AsignarTemaClaseParams{IDClase: 1, IDTema: 1})
	if !esAlreadyExists(err) {
		t.Fatalf("esperaba AlreadyExists, obtuvo: %v", err)
	}
}

func TestDesasignarDocenteSvc_Exito(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	err := svc.DesasignarDocente(types.DesasignarDocenteParams{IDClase: 1, IDUsuario: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestDesasignarDocenteSvc_IDClaseCero(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	err := svc.DesasignarDocente(types.DesasignarDocenteParams{IDClase: 0, IDUsuario: 1})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestDesasignarAuxiliarSvc_Exito(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	err := svc.DesasignarAuxiliar(types.DesasignarAuxiliarParams{IDClase: 1, IDUsuario: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestDesasignarMaterialApoyoSvc_IDCero(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	err := svc.DesasignarMaterialApoyo(types.DesasignarMaterialApoyoParams{IDMaterial: 0})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestDesasignarTemaClaseGrabadaSvc_Exito(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	err := svc.DesasignarTemaClaseGrabada(types.DesasignarTemaClaseParams{IDClase: 1, IDTema: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestConsultarParticipantesClaseSvc_Exito(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{participantes: []types.Participante{{IDClase: 1, IDUsuario: 1, TipoParticipante: "DOCENTE"}}}, &classRepoForAssignSvc{clasePorId: claseBaseSvc}, &topicRepoForAssignSvc{})
	result, err := svc.ConsultarParticipantesClase(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("esperaba 1 participante, obtuvo %d", len(result))
	}
}

func TestConsultarParticipantesClaseSvc_IDCero(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	_, err := svc.ConsultarParticipantesClase(0)
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestMapAssignErrorSvc_Nil(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	err := svc.mapAssignError(nil)
	if err != nil {
		t.Fatalf("esperaba nil, obtuvo: %v", err)
	}
}

func TestMapAssignErrorSvc_YaFueAsignado(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	err := svc.mapAssignError(errors.New("ya fue asignado"))
	if !esAlreadyExists(err) {
		t.Fatalf("esperaba AlreadyExists, obtuvo: %v", err)
	}
}

func TestMapAssignErrorSvc_YaAsociado(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	err := svc.mapAssignError(errors.New("ya está asociado"))
	if !esAlreadyExists(err) {
		t.Fatalf("esperaba AlreadyExists, obtuvo: %v", err)
	}
}

func TestMapAssignErrorSvc_NoExiste(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	err := svc.mapAssignError(errors.New("no existe"))
	if !esNotFound(err) {
		t.Fatalf("esperaba NotFound, obtuvo: %v", err)
	}
}

func TestMapAssignErrorSvc_Otro(t *testing.T) {
	svc := NewAssignService(&assignRepoForAssignSvc{}, &classRepoForAssignSvc{}, &topicRepoForAssignSvc{})
	err := svc.mapAssignError(errors.New("otro error"))
	if !esInternal(err) {
		t.Fatalf("esperaba Internal, obtuvo: %v", err)
	}
}
