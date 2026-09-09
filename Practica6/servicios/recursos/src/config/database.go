package config

import (
	"database/sql"
	"sync"
	"time"

	_ "github.com/lib/pq"
)

var (
	dbOnce sync.Once
	db     *sql.DB
	dbErr  error
)

// GetDatabase devuelve la conexión a PostgreSQL (singleton).
func GetDatabase() (*sql.DB, error) {
	dbOnce.Do(func() {
		cfg, err := GetConfig()
		if err != nil {
			dbErr = err
			return
		}

		db, dbErr = sql.Open("postgres", cfg.DB.DSN())
		if dbErr != nil {
			return
		}

		db.SetMaxOpenConns(20)
		db.SetMaxIdleConns(5)
		db.SetConnMaxLifetime(30 * time.Minute)
		db.SetConnMaxIdleTime(5 * time.Minute)
	})
	return db, dbErr
}

// CloseDatabase cierra la conexión a la base de datos.
func CloseDatabase() error {
	if db == nil {
		return nil
	}
	return db.Close()
}
