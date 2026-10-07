// HeinzGomez - Práctica 7: Node 18 no expone Web Crypto como global (Node >= 20 sí).
// Se toma de node:crypto para que las pruebas funcionen en cualquier versión soportada.
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}
