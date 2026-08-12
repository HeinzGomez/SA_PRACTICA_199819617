// Package csvparser convierte el archivo CSV subido desde el Panel de
// Administración en filas listas para enviar al procedimiento almacenado
// sp_bulk_ingest_recordings_csv (ver internal/repository/catalog_repository.go).
//
// Formato esperado del CSV (con encabezado, separador coma):
//
//	title,course_id,semester,school,unit,video_url,professors,tags
//
// "professors" y "tags" admiten múltiples valores separados por ";"
// dentro de la misma celda. Ejemplo de fila:
//
//	Clase 1 - Introducción,11111111-1111-1111-1111-111111111111,2026-S2,Ciencias y Sistemas,Unidad 1,https://ejemplo.com/video1.mp4,Ing. Juan Pérez;Ing. Ana López,microservicios;grpc
package csvparser

import (
	"encoding/csv"
	"fmt"
	"io"
	"strings"

	"yousac/content-service/internal/repository"
)

var requiredColumns = []string{"title", "course_id", "semester", "school", "unit", "video_url", "professors", "tags"}

// Parse lee el CSV completo desde un reader y devuelve las filas
// estructuradas. No inserta nada en la base de datos: eso ocurre en el
// procedimiento almacenado, del lado del servidor de PostgreSQL.
func Parse(r io.Reader) ([]repository.CsvRow, error) {
	reader := csv.NewReader(r)
	reader.TrimLeadingSpace = true

	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("no se pudo leer el encabezado del CSV: %w", err)
	}

	colIndex := make(map[string]int, len(header))
	for i, col := range header {
		colIndex[strings.ToLower(strings.TrimSpace(col))] = i
	}

	for _, required := range requiredColumns {
		if _, ok := colIndex[required]; !ok {
			return nil, fmt.Errorf("falta la columna obligatoria %q en el CSV (columnas esperadas: %s)", required, strings.Join(requiredColumns, ", "))
		}
	}

	var rows []repository.CsvRow
	lineNumber := 1 // el encabezado ya es la linea 1

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		lineNumber++
		if err != nil {
			return nil, fmt.Errorf("error leyendo la linea %d del CSV: %w", lineNumber, err)
		}
		if len(record) == 0 || (len(record) == 1 && strings.TrimSpace(record[0]) == "") {
			continue // ignora lineas vacias
		}

		get := func(col string) string {
			idx, ok := colIndex[col]
			if !ok || idx >= len(record) {
				return ""
			}
			return strings.TrimSpace(record[idx])
		}

		splitList := func(raw string) []string {
			if raw == "" {
				return nil
			}
			parts := strings.Split(raw, ";")
			out := make([]string, 0, len(parts))
			for _, p := range parts {
				p = strings.TrimSpace(p)
				if p != "" {
					out = append(out, p)
				}
			}
			return out
		}

		rows = append(rows, repository.CsvRow{
			Title:      get("title"),
			CourseID:   get("course_id"),
			Semester:   get("semester"),
			School:     get("school"),
			Unit:       get("unit"),
			VideoURL:   get("video_url"),
			Professors: splitList(get("professors")),
			Tags:       splitList(get("tags")),
		})
	}

	if len(rows) == 0 {
		return nil, fmt.Errorf("el CSV no contiene filas de datos")
	}

	return rows, nil
}
