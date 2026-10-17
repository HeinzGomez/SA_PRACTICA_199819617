// HeinzGomez - Práctica 7: control de cupo atómico en Redis mediante script Lua.
// Claves compartidas con el Servicio de Talleres:
//   cupo:evento:{id}       -> contador de cupos disponibles (lo inicializa Talleres)
//   inscritos:evento:{id}  -> SET de usuarios con reserva confirmada (evita duplicados)
package store

import (
	"context"

	"github.com/academix/reservas-service/internal/domain"
	"github.com/redis/go-redis/v9"
)

const ScriptReservar = `
local cupoKey = KEYS[1]
local setKey  = KEYS[2]
local usuario = ARGV[1]
local cupo = redis.call('GET', cupoKey)
if not cupo then return -3 end
if redis.call('SISMEMBER', setKey, usuario) == 1 then return -2 end
if tonumber(cupo) <= 0 then return -1 end
local restante = redis.call('DECR', cupoKey)
redis.call('SADD', setKey, usuario)
return restante
`

func CupoKey(eventoID string) string      { return "cupo:evento:" + eventoID }
func InscritosKey(eventoID string) string { return "inscritos:evento:" + eventoID }

type RedisCupoStore struct {
	rdb    *redis.Client
	script *redis.Script
}

func NewRedisCupoStore(rdb *redis.Client) *RedisCupoStore {
	return &RedisCupoStore{rdb: rdb, script: redis.NewScript(ScriptReservar)}
}

func (s *RedisCupoStore) Reservar(ctx context.Context, eventoID, usuarioID string) (domain.ResultadoCupo, error) {
	n, err := s.script.Run(ctx, s.rdb, []string{CupoKey(eventoID), InscritosKey(eventoID)}, usuarioID).Int64()
	if err != nil {
		return 0, err
	}
	return domain.ResultadoCupo(n), nil
}
