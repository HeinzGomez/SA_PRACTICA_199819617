package types

type ErrorCode string

const (
	CodeInvalidArgument ErrorCode = "INVALID_ARGUMENT"
	CodeNotFound        ErrorCode = "NOT_FOUND"
	CodeAlreadyExists   ErrorCode = "ALREADY_EXISTS"
	CodeInternal        ErrorCode = "INTERNAL"
)

type AppError struct {
	Code    ErrorCode
	Message string
	Err     error
}

func (e *AppError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	if e.Err != nil {
		return e.Err.Error()
	}
	return "error interno del servidor"
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func NewInvalidArgumentError(message string) *AppError {
	return &AppError{Code: CodeInvalidArgument, Message: message}
}

func NewNotFoundError(message string) *AppError {
	return &AppError{Code: CodeNotFound, Message: message}
}

func NewAlreadyExistsError(message string) *AppError {
	return &AppError{Code: CodeAlreadyExists, Message: message}
}

func NewInternalError(message string) *AppError {
	return &AppError{Code: CodeInternal, Message: message}
}
