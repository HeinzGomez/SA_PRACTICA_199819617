package controller

import (
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"servicio-grabaciones/types"
)

func TestToGrpcError_Nil(t *testing.T) {
	result := toGrpcError(nil)
	if result != nil {
		t.Fatalf("esperaba nil, obtuvo: %v", result)
	}
}

func TestToGrpcError_InvalidArgument(t *testing.T) {
	err := types.NewInvalidArgumentError("campo requerido")
	result := toGrpcError(err)
	st, ok := status.FromError(result)
	if !ok {
		t.Fatalf("esperaba status error")
	}
	if st.Code() != codes.InvalidArgument {
		t.Fatalf("esperaba InvalidArgument, obtuvo %v", st.Code())
	}
}

func TestToGrpcError_NotFound(t *testing.T) {
	err := types.NewNotFoundError("no encontrado")
	result := toGrpcError(err)
	st, ok := status.FromError(result)
	if !ok {
		t.Fatalf("esperaba status error")
	}
	if st.Code() != codes.NotFound {
		t.Fatalf("esperaba NotFound, obtuvo %v", st.Code())
	}
}

func TestToGrpcError_AlreadyExists(t *testing.T) {
	err := types.NewAlreadyExistsError("ya existe")
	result := toGrpcError(err)
	st, ok := status.FromError(result)
	if !ok {
		t.Fatalf("esperaba status error")
	}
	if st.Code() != codes.AlreadyExists {
		t.Fatalf("esperaba AlreadyExists, obtuvo %v", st.Code())
	}
}

func TestToGrpcError_Internal(t *testing.T) {
	err := types.NewInternalError("error interno")
	result := toGrpcError(err)
	st, ok := status.FromError(result)
	if !ok {
		t.Fatalf("esperaba status error")
	}
	if st.Code() != codes.Internal {
		t.Fatalf("esperaba Internal, obtuvo %v", st.Code())
	}
}

func TestToGrpcError_NonAppError(t *testing.T) {
	err := &types.AppError{Code: "UNKNOWN_CODE", Message: "test"}
	result := toGrpcError(err)
	st, ok := status.FromError(result)
	if !ok {
		t.Fatalf("esperaba status error")
	}
	if st.Code() != codes.Internal {
		t.Fatalf("esperaba Internal para codigo desconocido, obtuvo %v", st.Code())
	}
}

func TestToGrpcError_PlainError(t *testing.T) {
	result := toGrpcError(status.Error(codes.NotFound, "test"))
	if result == nil {
		t.Fatalf("esperaba error, obtuvo nil")
	}
}

func TestStrVal_Nil(t *testing.T) {
	if strVal(nil) != "" {
		t.Fatalf("esperaba string vacio para nil")
	}
}

func TestStrVal_ConValor(t *testing.T) {
	s := "hola"
	if strVal(&s) != "hola" {
		t.Fatalf("esperaba 'hola'")
	}
}

func TestStrPtr(t *testing.T) {
	s := strPtr("test")
	if s == nil || *s != "test" {
		t.Fatalf("esperaba puntero a 'test'")
	}
}
