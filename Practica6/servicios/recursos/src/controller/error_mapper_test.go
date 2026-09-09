package controller

import (
	"fmt"
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"servicio_recursos/types"
)

func TestToGrpcError_Nil(t *testing.T) {
	if err := toGrpcError(nil); err != nil {
		t.Errorf("esperaba nil, obtuvo %v", err)
	}
}

func TestToGrpcError_InvalidArgument(t *testing.T) {
	err := toGrpcError(types.NewInvalidArgumentError("campo requerido"))
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, ok := status.FromError(err)
	if !ok {
		t.Fatal("esperaba gRPC status error")
	}
	if st.Code() != codes.InvalidArgument {
		t.Errorf("esperaba InvalidArgument, obtuvo %v", st.Code())
	}
	if st.Message() != "campo requerido" {
		t.Errorf("esperaba 'campo requerido', obtuvo '%s'", st.Message())
	}
}

func TestToGrpcError_NotFound(t *testing.T) {
	err := toGrpcError(types.NewNotFoundError("no existe"))
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.NotFound {
		t.Errorf("esperaba NotFound, obtuvo %v", st.Code())
	}
	if st.Message() != "no existe" {
		t.Errorf("esperaba 'no existe', obtuvo '%s'", st.Message())
	}
}

func TestToGrpcError_AlreadyExists(t *testing.T) {
	err := toGrpcError(types.NewAlreadyExistsError("duplicado"))
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.AlreadyExists {
		t.Errorf("esperaba AlreadyExists, obtuvo %v", st.Code())
	}
	if st.Message() != "duplicado" {
		t.Errorf("esperaba 'duplicado', obtuvo '%s'", st.Message())
	}
}

func TestToGrpcError_Internal(t *testing.T) {
	err := toGrpcError(types.NewInternalError("fallo interno"))
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.Internal {
		t.Errorf("esperaba Internal, obtuvo %v", st.Code())
	}
	if st.Message() != "fallo interno" {
		t.Errorf("esperaba 'fallo interno', obtuvo '%s'", st.Message())
	}
}

func TestToGrpcError_UnknownCode(t *testing.T) {
	err := toGrpcError(&types.AppError{Code: "UNKNOWN_CODE", Message: "algo"})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.Internal {
		t.Errorf("esperaba Internal para código desconocido, obtuvo %v", st.Code())
	}
}

func TestToGrpcError_PlainError(t *testing.T) {
	err := toGrpcError(fmt.Errorf("error genérico"))
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.Internal {
		t.Errorf("esperaba Internal, obtuvo %v", st.Code())
	}
	if st.Message() != "error genérico" {
		t.Errorf("esperaba 'error genérico', obtuvo '%s'", st.Message())
	}
}
