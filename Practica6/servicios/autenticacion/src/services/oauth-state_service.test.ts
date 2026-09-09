import { OAuthStateServiceImpl } from "./oauth-state_service";

describe("OAuthStateServiceImpl", () => {
  const secret = "test-secret-key-for-oauth-state";
  let service: OAuthStateServiceImpl;

  beforeEach(() => {
    service = new OAuthStateServiceImpl(secret);
  });

  describe("generarState", () => {
    it("deberia generar un state con formato payload.signature", () => {
      const state = service.generarState();
      const parts = state.split(".");
      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
    });

    it("deberia generar states diferentes cada vez", () => {
      const state1 = service.generarState();
      const state2 = service.generarState();
      expect(state1).not.toBe(state2);
    });
  });

  describe("validarState", () => {
    it("deberia validar un state generado recientemente", () => {
      const state = service.generarState();
      expect(service.validarState(state)).toBe(true);
    });

    it("deberia rechazar un state con formato invalido", () => {
      expect(service.validarState("invalid")).toBe(false);
    });

    it("deberia rechazar un state con solo un punto", () => {
      expect(service.validarState("abc.")).toBe(false);
    });

    it("deberia rechazar un state vacio", () => {
      expect(service.validarState("")).toBe(false);
    });

    it("deberia rechazar un state con firma incorrecta", () => {
      const state = service.generarState();
      const parts = state.split(".");
      const tampered = parts[0] + ".invalidsignature";
      expect(service.validarState(tampered)).toBe(false);
    });

    it("deberia rechazar un state con otro secret", () => {
      const otherService = new OAuthStateServiceImpl("other-secret");
      const state = otherService.generarState();
      expect(service.validarState(state)).toBe(false);
    });

    it("deberia rechazar un state con mas de 2 partes", () => {
      expect(service.validarState("a.b.c")).toBe(false);
    });
  });

  describe("simulacion expiracion", () => {
    it("deberia rechazar un state con timestamp viejo", () => {
      const fakeOldState = (() => {
        const payload = { nonce: "abc123", timestamp: Date.now() - 2 * 60 * 60 * 1000 };
        const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
        const crypto = require("crypto");
        const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
        return `${encoded}.${sig}`;
      })();

      expect(service.validarState(fakeOldState)).toBe(false);
    });
  });
});
