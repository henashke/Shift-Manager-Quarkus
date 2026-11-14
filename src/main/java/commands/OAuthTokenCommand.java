package commands;

import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.HeaderParam;

/**
 * A request to the OAuth token endpoint (form-encoded): exchanges an authorization code or a refresh token for tokens.
 * A confidential client authenticates with client_secret in the form or with HTTP Basic.
 */
public class OAuthTokenCommand {
    @FormParam("grant_type")
    public String grantType;
    @FormParam("code")
    public String code;
    @FormParam("redirect_uri")
    public String redirectUri;
    @FormParam("code_verifier")
    public String codeVerifier;
    @FormParam("refresh_token")
    public String refreshToken;
    @FormParam("client_id")
    public String clientId;
    @FormParam("client_secret")
    public String clientSecret;
    @HeaderParam("Authorization")
    public String authorization;
}
