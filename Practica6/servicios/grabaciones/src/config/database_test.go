package config

import (
	"sync"
	"testing"
)

func TestCloseDatabase_Nil(t *testing.T) {
	// Reset singleton
	dbOnce = *new(sync.Once)
	db = nil
	dbErr = nil
	err := CloseDatabase()
	if err != nil {
		t.Fatalf("esperaba nil, obtuvo: %v", err)
	}
}
