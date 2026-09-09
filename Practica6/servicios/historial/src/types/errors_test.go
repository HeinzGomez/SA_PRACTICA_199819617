package types

import (
	"errors"
	"testing"
)

func TestAppError_ConMensaje(t *testing.T) {
	err := &AppError{Code: CodeNotFound, Message: "no encontrado"}
	if err.Error() != "no encontrado" {
		t.Fatalf("esperaba 'no encontrado', obtuvo '%s'", err.Error())
	}
}

func TestAppError_ConErr(t *testing.T) {
	inner := errors.New("inner error")
	err := &AppError{Code: CodeInternal, Err: inner}
	if err.Error() != "inner error" {
		t.Fatalf("esperaba 'inner error', obtuvo '%s'", err.Error())
	}
}

func TestAppError_SinDatos(t *testing.T) {
	err := &AppError{Code: CodeInternal}
	if err.Error() != "error interno del servidor" {
		t.Fatalf("esperaba mensaje por defecto, obtuvo '%s'", err.Error())
	}
}

func TestAppError_Unwrap(t *testing.T) {
	inner := errors.New("inner")
	err := &AppError{Code: CodeInternal, Err: inner}
	if !errors.Is(err, inner) {
		t.Fatal("esperaba que errors.Is funcionara con el error interno")
	}
}

func TestNewInvalidArgumentError(t *testing.T) {
	err := NewInvalidArgumentError("campo requerido")
	if err.Code != CodeInvalidArgument {
		t.Fatalf("esperaba INVALID_ARGUMENT, obtuvo %s", err.Code)
	}
	if err.Message != "campo requerido" {
		t.Fatalf("esperaba 'campo requerido', obtuvo '%s'", err.Message)
	}
}

func TestNewNotFoundError(t *testing.T) {
	err := NewNotFoundError("no existe")
	if err.Code != CodeNotFound {
		t.Fatalf("esperaba NOT_FOUND, obtuvo %s", err.Code)
	}
}

func TestNewAlreadyExistsError(t *testing.T) {
	err := NewAlreadyExistsError("duplicado")
	if err.Code != CodeAlreadyExists {
		t.Fatalf("esperaba ALREADY_EXISTS, obtuvo %s", err.Code)
	}
}

func TestNewInternalError(t *testing.T) {
	err := NewInternalError("fallo")
	if err.Code != CodeInternal {
		t.Fatalf("esperaba INTERNAL, obtuvo %s", err.Code)
	}
}
