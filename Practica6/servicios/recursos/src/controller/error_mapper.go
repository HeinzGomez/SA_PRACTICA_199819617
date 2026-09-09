package controller

import (
	"errors"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"servicio_recursos/types"
)

func toGrpcError(err error) error {
	if err == nil {
		return nil
	}

	var appErr *types.AppError
	if errors.As(err, &appErr) {
		switch appErr.Code {
		case types.CodeInvalidArgument:
			return status.Error(codes.InvalidArgument, appErr.Message)
		case types.CodeNotFound:
			return status.Error(codes.NotFound, appErr.Message)
		case types.CodeAlreadyExists:
			return status.Error(codes.AlreadyExists, appErr.Message)
		default:
			return status.Error(codes.Internal, appErr.Message)
		}
	}
	return status.Error(codes.Internal, err.Error())
}
