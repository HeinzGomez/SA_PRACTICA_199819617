import { google, Auth } from "googleapis";
import {
  OAuthTokens,
  OAuthUser,
} from "../types/oauth.types";

export interface GoogleOAuthService {
  generarAuthorizationUrl(state: string): string;

  obtenerTokens(code: string): Promise<OAuthTokens>;

  obtenerUsuario(tokens: OAuthTokens): Promise<OAuthUser>;
}

export class GoogleOAuthServiceImpl implements GoogleOAuthService{
    private readonly oauth2Client: Auth.OAuth2Client;

    constructor(
        private readonly clientId: string,
        private readonly clientSecret: string,
        private readonly redirectUri: string
    ) {
        this.oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri
        );
    }

    generarAuthorizationUrl(state: string): string {
        return this.oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
            "openid",
            "email",
            "profile",
        ],
        state,
        prompt: "select_account",
        });
    }

    async obtenerTokens(code: string): Promise<OAuthTokens> {
        const { tokens } =
        await this.oauth2Client.getToken(code);

        return {
        accessToken: tokens.access_token ?? undefined,
        refreshToken: tokens.refresh_token ?? undefined,
        idToken: tokens.id_token ?? undefined,
        };
    }

    async obtenerUsuario(tokens: OAuthTokens): Promise<OAuthUser> {
        if (!tokens.accessToken) {
        throw new Error(
            "Google no proporcionó un access token."
        );
        }

        this.oauth2Client.setCredentials({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            id_token: tokens.idToken,
        });

        const oauth2 = google.oauth2({
            version: "v2",
            auth: this.oauth2Client,
        });

        const { data } = await oauth2.userinfo.get();

        if (!data.id) {
        throw new Error(
            "Google no proporcionó el identificador del usuario."
        );
        }

        if (!data.email) {
        throw new Error(
            "Google no proporcionó el correo electrónico del usuario."
        );
        }

        if (!data.name) {
        throw new Error(
            "Google no proporcionó el nombre del usuario."
        );
        }

        return {
        providerId: data.id,
        email: data.email,
        name: data.name,
        firstName: data.given_name ?? undefined,
        lastName: data.family_name ?? undefined,
        picture: data.picture ?? undefined,
        };
    }

}