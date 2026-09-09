package types

import (
	"errors"
	"testing"
)

func TestAppError_Error_Mensaje(t *testing.T) {
	e := NewInvalidArgumentError("campo inválido")
	if e.Error() != "campo inválido" {
		t.Errorf("esperaba 'campo inválido', obtuvo '%s'", e.Error())
	}
}

func TestAppError_Error_SinMensaje(t *testing.T) {
	e := &AppError{Code: CodeInternal}
	if e.Error() != "error interno del servidor" {
		t.Errorf("esperaba mensaje por defecto, obtuvo '%s'", e.Error())
	}
}

func TestAppError_Error_ConErr(t *testing.T) {
	e := &AppError{Code: CodeInternal, Err: errors.New("underlying")}
	if e.Error() != "underlying" {
		t.Errorf("esperaba 'underlying', obtuvo '%s'", e.Error())
	}
}

func TestAppError_Unwrap(t *testing.T) {
	inner := errors.New("inner")
	e := &AppError{Code: CodeInternal, Err: inner}
	if !errors.Is(e, inner) {
		t.Error("esperaba que errors.Is encontrara el error interno")
	}
}

func TestNewInvalidArgumentError(t *testing.T) {
	e := NewInvalidArgumentError("bad arg")
	if e.Code != CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo %v", e.Code)
	}
}

func TestNewNotFoundError(t *testing.T) {
	e := NewNotFoundError("not found")
	if e.Code != CodeNotFound {
		t.Errorf("esperaba NOT_FOUND, obtuvo %v", e.Code)
	}
}

func TestNewAlreadyExistsError(t *testing.T) {
	e := NewAlreadyExistsError("exists")
	if e.Code != CodeAlreadyExists {
		t.Errorf("esperaba ALREADY_EXISTS, obtuvo %v", e.Code)
	}
}

func TestNewInternalError(t *testing.T) {
	e := NewInternalError("fail")
	if e.Code != CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo %v", e.Code)
	}
}
