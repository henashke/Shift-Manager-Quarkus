package responders;

import commands.OAuthAuthorizeCommand;
import commands.OAuthTokenCommand;
import commands.RegisterOAuthClientCommand;
import dto.*;
import entities.OAuthClient;
import io.quarkus.security.AuthenticationFailedException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.core.CacheControl;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import lombok.RequiredArgsConstructor;
import services.OAuthException;
import services.OAuthService;
import util.PublicUrl;

import java.net.URI;
import java.util.List;

import static responders.ErrorResponses.error;

@ApplicationScoped
@RequiredArgsConstructor
public class OAuthResponder {

    private final OAuthService oauthService;
    private final PublicUrl publicUrl;

    public OAuthProtectedResourceDto protectedResourceMetadata(UriInfo uriInfo) {
        String base = baseUrl(uriInfo);
        OAuthProtectedResourceDto dto = new OAuthProtectedResourceDto();
        dto.resource = publicUrl.mcpEndpoint(base);
        dto.authorizationServers = List.of(publicUrl.resolve(base));
        return dto;
    }

    public OAuthServerMetadataDto serverMetadata(UriInfo uriInfo) {
        String issuer = publicUrl.resolve(baseUrl(uriInfo));
        OAuthServerMetadataDto dto = new OAuthServerMetadataDto();
        dto.issuer = issuer;
        dto.authorizationEndpoint = issuer + "/oauth/authorize";
        dto.tokenEndpoint = issuer + "/oauth/token";
        dto.registrationEndpoint = issuer + "/oauth/register";
        return dto;
    }

    public Response register(RegisterOAuthClientCommand command) {
        try {
            OAuthService.RegisteredClient registered = oauthService.register(command);
            OAuthClient client = registered.client();
            OAuthClientRegistrationDto dto = new OAuthClientRegistrationDto();
            dto.clientId = client.clientId;
            dto.clientSecret = registered.rawSecret();
            dto.clientIdIssuedAt = client.createdAt.getEpochSecond();
            dto.clientSecretExpiresAt = registered.rawSecret() == null ? null : 0L;
            dto.clientName = client.clientName;
            dto.redirectUris = client.redirectUriList();
            dto.tokenEndpointAuthMethod = command.tokenEndpointAuthMethod == null ? "none" : command.tokenEndpointAuthMethod;
            dto.grantTypes = List.of("authorization_code", "refresh_token");
            dto.responseTypes = List.of("code");
            return noStore(Response.status(Response.Status.CREATED).entity(dto));
        } catch (OAuthException e) {
            return oauthError(e);
        }
    }

    /**
     * The app's authorization request: sends the browser to the frontend's connect page with the same parameters, where
     * the user signs in and approves. A request with an unknown client or redirect URI never leaves this server.
     */
    public Response authorize(UriInfo uriInfo) {
        String clientId = uriInfo.getQueryParameters().getFirst("client_id");
        String redirectUri = uriInfo.getQueryParameters().getFirst("redirect_uri");
        try {
            oauthService.requireClientAndRedirect(clientId, redirectUri);
        } catch (OAuthException e) {
            return Response.status(Response.Status.BAD_REQUEST).type(MediaType.TEXT_PLAIN_TYPE)
                    .entity("Can't connect: " + e.getMessage()).build();
        }
        String query = uriInfo.getRequestUri().getRawQuery();
        return Response.seeOther(URI.create("/connect?" + query)).build();
    }

    public Response clientInfo(String clientId, String redirectUri) {
        try {
            OAuthClient client = oauthService.requireClientAndRedirect(clientId, redirectUri);
            return Response.ok(new OAuthClientInfoDto(client.clientName, URI.create(redirectUri).getHost())).build();
        } catch (OAuthException e) {
            return error(Response.Status.BAD_REQUEST, e.getMessage());
        }
    }

    public Response approve(OAuthAuthorizeCommand command, String signedInUsername) {
        if (command == null) return error(Response.Status.BAD_REQUEST, "Missing request body");
        try {
            return Response.ok(new OAuthRedirectDto(oauthService.authorize(command, signedInUsername))).build();
        } catch (OAuthException e) {
            return error(Response.Status.BAD_REQUEST, e.getMessage());
        } catch (AuthenticationFailedException e) {
            return error(Response.Status.UNAUTHORIZED, "שם המשתמש או הסיסמה שגויים");
        }
    }

    public Response token(OAuthTokenCommand command) {
        try {
            OAuthService.Tokens tokens = oauthService.token(command);
            OAuthTokenDto dto = new OAuthTokenDto();
            dto.accessToken = tokens.accessToken();
            dto.expiresIn = tokens.expiresIn();
            dto.refreshToken = tokens.refreshToken();
            return noStore(Response.ok(dto));
        } catch (OAuthException e) {
            return oauthError(e);
        }
    }

    private static Response oauthError(OAuthException e) {
        Response.ResponseBuilder builder = Response.status(e.getStatus())
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(new OAuthErrorDto(e.getError(), e.getMessage()));
        if (e.getStatus() == 401) builder.header("WWW-Authenticate", "Basic realm=\"oauth\"");
        return noStore(builder);
    }

    // Token responses must never be cached (RFC 6749 5.1)
    private static Response noStore(Response.ResponseBuilder builder) {
        CacheControl cacheControl = new CacheControl();
        cacheControl.setNoStore(true);
        return builder.cacheControl(cacheControl).type(MediaType.APPLICATION_JSON_TYPE).build();
    }

    private static String baseUrl(UriInfo uriInfo) {
        URI base = uriInfo.getBaseUri();
        return base.getScheme() + "://" + base.getRawAuthority();
    }
}
