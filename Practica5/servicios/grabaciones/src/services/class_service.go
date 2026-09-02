package services

import (
	"database/sql"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"servicio-grabaciones/repositories"
	"servicio-grabaciones/types"
)

type ClassService interface {
	CrearClaseGrabada(params types.CrearClaseGrabadaParams) (types.ClaseGrabada, error)
	EditarClaseGrabada(params types.EditarClaseGrabadaParams) (types.ClaseGrabada, error)
	EliminarClaseGrabada(idClase int32) error
	CargaMasivaClases(clases []types.ClaseCargaInput) (types.BatchCrearClaseResponse, error)
	BusquedaAvanzada(filtros types.BusquedaAvanzadaFiltros) (types.BusquedaAvanzadaResult, error)
	ConsultarCatalogoClases(params types.ConsultarCatalogoClasesParams) (types.CatalogoClasesResult, error)
	ObtenerDetalleClaseGrabada(idClase int32) (types.DetalleClaseGrabada, error)
	ObtenerEnlaceClaseGrabada(idClase int32) (string, error)
}

type ClassServiceImp struct {
	classRepo  repositories.ClassRepository
	assignRepo repositories.AssignRepository
}

func NewClassService(
	classRepo repositories.ClassRepository,
	assignRepo repositories.AssignRepository,
) *ClassServiceImp {
	return &ClassServiceImp{
		classRepo:  classRepo,
		assignRepo: assignRepo,
	}
}

func (s *ClassServiceImp) CrearClaseGrabada(params types.CrearClaseGrabadaParams) (types.ClaseGrabada, error) {
	if err := s.validarClaseFields(
		params.IDCurso, params.IDPeriodo, params.IDArea, params.Titulo,
		params.FechaImpartida, params.DuracionMin, params.URLVideo,
		params.Anio, params.NumSemestre,
	); err != nil {
		return types.ClaseGrabada{}, err
	}

	clase, err := s.classRepo.CrearClaseGrabada(params)
	if err != nil {
		return types.ClaseGrabada{}, types.NewInternalError(err.Error())
	}
	return clase, nil
}

func (s *ClassServiceImp) EditarClaseGrabada(params types.EditarClaseGrabadaParams) (types.ClaseGrabada, error) {
	if params.ID <= 0 {
		return types.ClaseGrabada{}, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}
	if err := s.validarClaseFields(
		params.IDCurso, params.IDPeriodo, params.IDArea, params.Titulo,
		params.FechaImpartida, params.DuracionMin, params.URLVideo,
		params.Anio, params.NumSemestre,
	); err != nil {
		return types.ClaseGrabada{}, err
	}
	if _, err := s.classRepo.BuscarClaseGrabada(params.ID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.ClaseGrabada{}, types.NewNotFoundError("La clase grabada indicada no existe")
		}
		return types.ClaseGrabada{}, types.NewInternalError(err.Error())
	}

	clase, err := s.classRepo.EditarClaseGrabada(params)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.ClaseGrabada{}, types.NewNotFoundError("La clase grabada indicada no existe")
		}
		return types.ClaseGrabada{}, types.NewInternalError(err.Error())
	}
	return clase, nil
}

func (s *ClassServiceImp) EliminarClaseGrabada(idClase int32) error {
	if idClase <= 0 {
		return types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}
	if err := s.classRepo.EliminarClaseGrabada(idClase); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.NewNotFoundError("La clase grabada indicada no existe")
		}
		return types.NewInternalError(err.Error())
	}
	return nil
}

func (s *ClassServiceImp) BusquedaAvanzada(filtros types.BusquedaAvanzadaFiltros) (types.BusquedaAvanzadaResult, error) {
	if filtros.Anio < 0 || filtros.Semestre < 0 || filtros.IDArea < 0 ||
		filtros.IDCurso < 0 || filtros.IDDocente < 0 || filtros.IDTema < 0 {
		return types.BusquedaAvanzadaResult{}, types.NewInvalidArgumentError("Los filtros no pueden ser negativos")
	}
	if filtros.Semestre > 2 {
		return types.BusquedaAvanzadaResult{}, types.NewInvalidArgumentError("El semestre debe ser 1 o 2")
	}

	result, err := s.classRepo.BusquedaAvanzada(filtros)
	if err != nil {
		return types.BusquedaAvanzadaResult{}, types.NewInternalError(err.Error())
	}
	return result, nil
}

func (s *ClassServiceImp) ConsultarCatalogoClases(params types.ConsultarCatalogoClasesParams) (types.CatalogoClasesResult, error) {
	result, err := s.classRepo.ConsultarCatalogoClases(params)
	if err != nil {
		return types.CatalogoClasesResult{}, types.NewInternalError(err.Error())
	}
	return result, nil
}

func (s *ClassServiceImp) ObtenerDetalleClaseGrabada(idClase int32) (types.DetalleClaseGrabada, error) {
	if idClase <= 0 {
		return types.DetalleClaseGrabada{}, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}

	clase, err := s.classRepo.BuscarClaseGrabada(idClase)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.DetalleClaseGrabada{}, types.NewNotFoundError("La clase grabada indicada no existe")
		}
		return types.DetalleClaseGrabada{}, types.NewInternalError(err.Error())
	}

	fichas, err := s.classRepo.ConsultarFichaTecnica(idClase)
	if err != nil {
		return types.DetalleClaseGrabada{}, types.NewInternalError(err.Error())
	}

	participantes, err := s.assignRepo.ConsultarParticipantesClase(idClase)
	if err != nil {
		return types.DetalleClaseGrabada{}, types.NewInternalError(err.Error())
	}

	return types.DetalleClaseGrabada{
		Clase:         clase,
		Temas:         s.agruparTemas(fichas),
		Materiales:    s.agruparMateriales(fichas, idClase),
		Participantes: participantes,
	}, nil
}

func (s *ClassServiceImp) ObtenerEnlaceClaseGrabada(idClase int32) (string, error) {
	if idClase <= 0 {
		return "", types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}

	urlVideo, err := s.classRepo.ObtenerEnlaceClaseGrabada(idClase)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", types.NewNotFoundError("La clase grabada indicada no existe")
		}
		return "", types.NewInternalError(err.Error())
	}
	return urlVideo, nil
}

func (s *ClassServiceImp) CargaMasivaClases(clases []types.ClaseCargaInput) (types.BatchCrearClaseResponse, error) {
	if len(clases) == 0 {
		return types.BatchCrearClaseResponse{}, types.NewInvalidArgumentError("La lista de clases está vacía")
	}
	// limit to reasonable batch size
	if len(clases) > 1000 {
		return types.BatchCrearClaseResponse{}, types.NewInvalidArgumentError("Demasiadas clases en la carga masiva")
	}

	// Marshal input to JSON that DB procedure expects
	payload, err := json.Marshal(clases)
	if err != nil {
		return types.BatchCrearClaseResponse{}, types.NewInternalError(err.Error())
	}

	resultJSON, err := s.classRepo.CargaMasivaClases(string(payload))
	if err != nil {
		return types.BatchCrearClaseResponse{}, types.NewInternalError(err.Error())
	}

	var rawResults []types.BatchCrearClaseResult
	if err := json.Unmarshal([]byte(resultJSON), &rawResults); err != nil {
		return types.BatchCrearClaseResponse{}, types.NewInternalError(err.Error())
	}

	return types.BatchCrearClaseResponse{
		Exito:      true,
		Mensaje:    "Carga procesada",
		Resultados: rawResults,
	}, nil
}

func (s *ClassServiceImp) validarClaseFields(
	idCurso int32,
	idPeriodo int32,
	idArea int32,
	titulo string,
	fechaImpartida string,
	duracionMin int32,
	urlVideo string,
	anio int32,
	numSemestre int32,
) error {
	switch {
	case idCurso <= 0:
		return types.NewInvalidArgumentError("El id del curso es obligatorio")
	case idPeriodo <= 0:
		return types.NewInvalidArgumentError("El id del período es obligatorio")
	case idArea <= 0:
		return types.NewInvalidArgumentError("El id del área es obligatorio")
	case strings.TrimSpace(titulo) == "":
		return types.NewInvalidArgumentError("El título de la clase es obligatorio")
	case duracionMin <= 0:
		return types.NewInvalidArgumentError("La duración debe ser mayor a cero")
	case strings.TrimSpace(urlVideo) == "":
		return types.NewInvalidArgumentError("La url del video es obligatoria")
	case anio <= 0:
		return types.NewInvalidArgumentError("El año es obligatorio")
	case numSemestre != 1 && numSemestre != 2:
		return types.NewInvalidArgumentError("El semestre debe ser 1 o 2")
	}

	if _, err := time.Parse("2006-01-02 15:04:05", fechaImpartida); err != nil {
		return types.NewInvalidArgumentError("La fecha de impartición debe tener el formato YYYY-MM-DD HH:MM:SS")
	}
	return nil
}

func (s *ClassServiceImp) agruparTemas(fichas []types.FichaTecnicaRow) []types.Tema {
	vistos := make(map[int32]bool)
	temas := make([]types.Tema, 0)

	for _, fila := range fichas {
		if fila.TemaID == nil || *fila.TemaID == 0 || vistos[*fila.TemaID] {
			continue
		}
		vistos[*fila.TemaID] = true

		tema := types.Tema{
			ID: *fila.TemaID,
		}
		if fila.UnidadID != nil {
			tema.UnidadID = *fila.UnidadID
		}
		tema.Unidad = fila.Unidad
		if fila.Tema != nil {
			tema.Nombre = *fila.Tema
		}
		temas = append(temas, tema)
	}
	return temas
}

func (s *ClassServiceImp) agruparMateriales(fichas []types.FichaTecnicaRow, idClase int32) []types.MaterialApoyo {
	vistos := make(map[int32]bool)
	materiales := make([]types.MaterialApoyo, 0)

	for _, fila := range fichas {
		if fila.MaterialID == nil || *fila.MaterialID == 0 || vistos[*fila.MaterialID] {
			continue
		}
		vistos[*fila.MaterialID] = true

		material := types.MaterialApoyo{ID: *fila.MaterialID, IDClase: idClase}
		if fila.Material != nil {
			material.Nombre = *fila.Material
		}
		if fila.Tipo != nil {
			material.Tipo = *fila.Tipo
		}
		if fila.MaterialURL != nil {
			material.URL = *fila.MaterialURL
		}
		materiales = append(materiales, material)
	}
	return materiales
}
