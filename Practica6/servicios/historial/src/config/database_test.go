package config

import (
	"testing"
)

func TestCloseDatabase_ConNil(t *testing.T) {
	db = nil
	err := CloseDatabase()
	if err != nil {
		t.Fatalf("esperaba nil, obtuvo: %v", err)
	}
}
