package types

import (
	"errors"
	"testing"
)

func TestAppError_Error_ConMensaje(t *testing.T) {
	err := &AppError{Code: CodeInvalidArgument, Message: "campo requerido"}
	if err.Error() != "campo requerido" {
		t.Fatalf("esperaba 'campo requerido', obtuvo %q", err.Error())
	}
}

func TestAppError_Error_ConErr(t *testing.T) {
	inner := errors.New("inner")
	err := &AppError{Code: CodeInternal, Err: inner}
	if err.Error() != "inner" {
		t.Fatalf("esperaba 'inner', obtuvo %q", err.Error())
	}
}

func TestAppError_Error_SinNada(t *testing.T) {
	err := &AppError{Code: CodeInternal}
	if err.Error() != "error interno del servidor" {
		t.Fatalf("esperaba default message, obtuvo %q", err.Error())
	}
}

func TestAppError_Unwrap(t *testing.T) {
	inner := errors.New("inner")
	err := &AppError{Code: CodeInternal, Err: inner}
	if !errors.Is(err, inner) {
		t.Fatal("esperaba que errors.Is funcionara con Unwrap")
	}
}

func TestNewInvalidArgumentError(t *testing.T) {
	err := NewInvalidArgumentError("test")
	if err.Code != CodeInvalidArgument {
		t.Fatalf("esperaba INVALID_ARGUMENT, obtuvo %s", err.Code)
	}
	if err.Message != "test" {
		t.Fatalf("esperaba 'test', obtuvo %q", err.Message)
	}
}

func TestNewNotFoundError(t *testing.T) {
	err := NewNotFoundError("not found")
	if err.Code != CodeNotFound {
		t.Fatalf("esperaba NOT_FOUND, obtuvo %s", err.Code)
	}
}

func TestNewAlreadyExistsError(t *testing.T) {
	err := NewAlreadyExistsError("already")
	if err.Code != CodeAlreadyExists {
		t.Fatalf("esperaba ALREADY_EXISTS, obtuvo %s", err.Code)
	}
}

func TestNewInternalError(t *testing.T) {
	err := NewInternalError("internal")
	if err.Code != CodeInternal {
		t.Fatalf("esperaba INTERNAL, obtuvo %s", err.Code)
	}
}
