package repositories

import (
	"testing"
)

func TestStrToNil_Vacio(t *testing.T) {
	result := strToNil("")
	if result != nil {
		t.Errorf("esperaba nil para string vacío, obtuvo %v", result)
	}
}

func TestStrToNil_ConValor(t *testing.T) {
	result := strToNil("hello")
	s, ok := result.(string)
	if !ok {
		t.Fatal("esperaba que resultado fuera string")
	}
	if s != "hello" {
		t.Errorf("esperaba 'hello', obtuvo '%s'", s)
	}
}

func TestStrToNil_NilInterface(t *testing.T) {
	var result interface{} = strToNil("")
	if result != nil {
		t.Errorf("esperaba nil interface, obtuvo %T(%v)", result, result)
	}
}
