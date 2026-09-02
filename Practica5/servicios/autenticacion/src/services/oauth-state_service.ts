import crypto from "crypto";
import { OAuthStatePayload } from "../types/oauth.types";

export interface OAuthStateService {
  generarState(): string;
  validarState(state: string): boolean;
}

export class OAuthStateServiceImpl implements OAuthStateService {
    private readonly stateExpirationMs = 60 * 60 * 1000;

    constructor(
        private readonly secret: string
    ) {}

  generarState(): string {
    const payload: OAuthStatePayload = {
      nonce: crypto.randomBytes(32).toString("hex"),
      timestamp: Date.now(),
    };

    const payloadEncoded = Buffer.from(
      JSON.stringify(payload)
    ).toString("base64url");

    const signature = this.generarFirma(payloadEncoded);

    return `${payloadEncoded}.${signature}`;
  }


  validarState(state: string): boolean {
    try {
      const partes = state.split(".");

      if (partes.length !== 2) {
        return false;
      }

      const [payloadEncoded, signature] = partes;

      const firmaEsperada = this.generarFirma(payloadEncoded);

      const firmaValida = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(firmaEsperada)
      );

      if (!firmaValida) {
        return false;
      }

      const payload: OAuthStatePayload = JSON.parse(
        Buffer.from(payloadEncoded, "base64url").toString("utf-8")
      );

      const ahora = Date.now();

      const expirado =
        ahora - payload.timestamp > this.stateExpirationMs;

      if (expirado) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private generarFirma(payload: string): string {
    return crypto
      .createHmac("sha256", this.secret)
      .update(payload)
      .digest("base64url");
  }

}