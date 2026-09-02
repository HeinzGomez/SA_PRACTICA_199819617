class BusinessValidationError(ValueError):
    """Error de validación de reglas de negocio, con código de estado HTTP."""


class NotFoundError(ValueError):
    """Error cuando el recurso que se intenta modificar o eliminar no existe."""
