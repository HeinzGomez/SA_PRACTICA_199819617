package controller

import (
	"errors"
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"servicio-historial/types"
)

func expectGrpcCode(t *testing.T, err error, expected codes.Code) {
	t.Helper()
	if err == nil {
		t.Fatal("esperaba error, obtuvo nil")
	}
	st, ok := status.FromError(err)
	if !ok {
		t.Fatalf("esperaba gRPC error, obtuvo %T", err)
	}
	if st.Code() != expected {
		t.Fatalf("esperaba codigo %s, obtuvo %s", expected, st.Code())
	}
}

func TestToGrpcError_Nil(t *testing.T) {
	result := toGrpcError(nil)
	if result != nil {
		t.Fatalf("esperaba nil, obtuvo %v", result)
	}
}

func TestToGrpcError_InvalidArgument(t *testing.T) {
	err := types.NewInvalidArgumentError("campo requerido")
	result := toGrpcError(err)
	expectGrpcCode(t, result, codes.InvalidArgument)
}

func TestToGrpcError_NotFound(t *testing.T) {
	err := types.NewNotFoundError("no existe")
	result := toGrpcError(err)
	expectGrpcCode(t, result, codes.NotFound)
}

func TestToGrpcError_AlreadyExists(t *testing.T) {
	err := types.NewAlreadyExistsError("duplicado")
	result := toGrpcError(err)
	expectGrpcCode(t, result, codes.AlreadyExists)
}

func TestToGrpcError_Internal(t *testing.T) {
	err := types.NewInternalError("fallo")
	result := toGrpcError(err)
	expectGrpcCode(t, result, codes.Internal)
}

func TestToGrpcError_PlainError(t *testing.T) {
	err := errors.New("error generico")
	result := toGrpcError(err)
	expectGrpcCode(t, result, codes.Internal)
}

func TestToGrpcError_MensajeInvalidArgument(t *testing.T) {
	err := types.NewInvalidArgumentError("campo requerido")
	result := toGrpcError(err)
	st, _ := status.FromError(result)
	if st.Message() != "campo requerido" {
		t.Fatalf("esperaba 'campo requerido', obtuvo '%s'", st.Message())
	}
}

func TestToGrpcError_MensajeNotFound(t *testing.T) {
	err := types.NewNotFoundError("recurso no encontrado")
	result := toGrpcError(err)
	st, _ := status.FromError(result)
	if st.Message() != "recurso no encontrado" {
		t.Fatalf("esperaba 'recurso no encontrado', obtuvo '%s'", st.Message())
	}
}

func TestToGrpcError_MensajeAlreadyExists(t *testing.T) {
	err := types.NewAlreadyExistsError("ya existe")
	result := toGrpcError(err)
	st, _ := status.FromError(result)
	if st.Message() != "ya existe" {
		t.Fatalf("esperaba 'ya existe', obtuvo '%s'", st.Message())
	}
}
