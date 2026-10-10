"""HeinzGomez - Práctica 9: reglas de calificación del examen de acreditación (CDU 3.6).

La nota se pondera con el punteo de cada pregunta (ya no con el conteo de aciertos):
nota = round(100 * punteo_acertado / punteo_total). Con punteos iguales el resultado es
idéntico al del conteo, y además permite preguntas con distinto peso.
"""
from __future__ import annotations

from typing import Dict, List, Sequence

from .modelos import Pregunta

# Valor por defecto del puntaje mínimo si el examen no lo trae definido.
NOTA_MINIMA = 70
MAX_INTENTOS = 3

ESTADO_ACTIVO = "ACTIVO"
ESTADO_INACTIVO = "INACTIVO"
ESTADOS_EXAMEN = (ESTADO_ACTIVO, ESTADO_INACTIVO)


def calificar(preguntas: Sequence[Pregunta], respuestas: Dict[str, str]) -> tuple[int, int, int]:
    """Devuelve (nota 0-100, cantidad de correctas, total de preguntas)."""
    if not preguntas:
        return 0, 0, 0
    punteo_total = sum(p.punteo or 0 for p in preguntas)
    acertadas: List[Pregunta] = [p for p in preguntas if p.es_correcta(respuestas.get(p.id))]
    correctas = len(acertadas)
    if punteo_total <= 0:
        return 0, correctas, len(preguntas)
    nota = round(100 * sum(p.punteo or 0 for p in acertadas) / punteo_total)
    return min(nota, 100), correctas, len(preguntas)
