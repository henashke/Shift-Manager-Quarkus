package services;

import auth.JwtTokenProvider;
import commands.OAuthAuthorizeCommand;
import commands.OAuthTokenCommand;
import commands.RegisterOAuthClientCommand;
import daos.OAuthAuthorizationCodeDao;
import daos.OAuthClientDao;
import daos.UserDao;
import entities.OAuthAuthorizationCode;
import entities.OAuthClient;
import entities.User;
import io.quarkus.security.AuthenticationFailedException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.mindrot.jbcrypt.BCrypt;
import util.SecureTokens;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * A minimal OAuth 2.1 authorization server, so chat apps (Claude, ChatGPT, Gemini...) can connect to the MCP server on
 * a user's behalf: dynamic client registration, the authorization code flow with PKCE (S256 only) and refresh tokens.
 * The tokens are the same ones the web app gets (an access JWT plus a rotating refresh token), bound to the client.
 */
@ApplicationScoped
@RequiredArgsConstructor
public class OAuthService {

    private static final Duration CODE_LIFESPAN = Duration.ofMinutes(5);
    private static final Set<String> AUTH_METHODS = Set.of("none", "client_secret_post", "client_secret_basic");
    private static final Set<String> GRANT_TYPES = Set.of("authorization_code", "refresh_token");
    // RFC 7636: 43-128 characters of [A-Z a-z 0-9 - . _ ~]
    private static final Pattern PKCE_VALUE = Pattern.compile("[A-Za-z0-9._~-]{43,128}");
    private static final int MAX_REDIRECT_URIS = 10;
    private static final int MAX_CLIENT_NAME_LENGTH = 200;

    // Not static: a static instance would be created during the native build and baked into the image with a fixed seed
    private final SecureRandom random = new SecureRandom();

    private final OAuthClientDao clientDao;
    private final OAuthAuthorizationCodeDao codeDao;
    private final UserDao userDao;
    private final RefreshTokenService refreshTokenService;
    private final JwtTokenProvider tokenProvider;

    public record RegisteredClient(OAuthClient client, String rawSecret) {
    }

    public record Tokens(String accessToken, long expiresIn, String refreshToken) {
    }

    @Transactional
    public RegisteredClient register(RegisterOAuthClientCommand command) {
        if (command == null) throw invalidClientMetadata("Missing registration body");
        if (command.redirectUris == null || command.redirectUris.isEmpty()) {
            throw new OAuthException(400, "invalid_redirect_uri", "redirect_uris is required");
        }
        if (command.redirectUris.size() > MAX_REDIRECT_URIS) {
            throw new OAuthException(400, "invalid_redirect_uri", "Too many redirect_uris");
        }
        command.redirectUris.forEach(OAuthService::requireValidRedirectUri);

        String authMethod = command.tokenEndpointAuthMethod == null ? "none" : command.tokenEndpointAuthMethod;
        if (!AUTH_METHODS.contains(authMethod)) {
            throw invalidClientMetadata("Unsupported token_endpoint_auth_method: " + authMethod);
        }
        if (command.grantTypes != null && !GRANT_TYPES.containsAll(command.grantTypes)) {
            throw invalidClientMetadata("Only the authorization_code and refresh_token grant types are supported");
        }
        if (command.responseTypes != null && !List.of("code").containsAll(command.responseTypes)) {
            throw invalidClientMetadata("Only the code response type is supported");
        }

        OAuthClient client = new OAuthClient();
        client.clientId = SecureTokens.random(random);
        client.clientName = clientName(command.clientName);
        client.redirectUris = String.join("\n", command.redirectUris);
        client.createdAt = Instant.now();
        String rawSecret = null;
        if (!authMethod.equals("none")) {
            rawSecret = SecureTokens.random(random);
            client.clientSecretHash = SecureTokens.hash(rawSecret);
        }
        clientDao.persist(client);
        return new RegisteredClient(client, rawSecret);
    }

    /**
     * @return the client, if it registered the given redirect URI
     * @throws OAuthException if the client is unknown or the redirect URI isn't one of its own. The user must not be sent
     *                        to such a URI, even with an error.
     */
    public OAuthClient requireClientAndRedirect(String clientId, String redirectUri) {
        OAuthClient client = clientId == null ? null : clientDao.findByClientId(clientId);
        if (client == null) throw OAuthException.invalidRequest("Unknown client. Try removing the connection and adding it again.");
        if (redirectUri == null || !client.redirectUriList().contains(redirectUri)) {
            throw OAuthException.invalidRequest("The app's redirect address isn't registered");
        }
        return client;
    }

    /**
     * Handles the user's answer on the connect page.
     *
     * @param signedInUsername the user of the page's Bearer token (or null), used when the command has no credentials
     * @return the URL to send the browser to: the app's redirect URI with a code (or an error), and its state
     * @throws AuthenticationFailedException for wrong credentials
     */
    @Transactional
    public String authorize(OAuthAuthorizeCommand command, String signedInUsername) {
        OAuthClient client = requireClientAndRedirect(command.clientId, command.redirectUri);
        if (!command.approve) return redirect(command.redirectUri, "error", "access_denied", command.state);
        if (!"code".equals(command.responseType)) {
            return redirect(command.redirectUri, "error", "unsupported_response_type", command.state);
        }
        if (!"S256".equals(command.codeChallengeMethod) || command.codeChallenge == null
                || !PKCE_VALUE.matcher(command.codeChallenge).matches()) {
            return redirect(command.redirectUri, "error", "invalid_request", command.state);
        }

        // Credentials win: a signed-in user may connect the app as someone else
        User user = command.username != null || signedInUsername == null
                ? authenticate(command.username, command.password)
                : userDao.findByUsername(signedInUsername).orElseThrow(AuthenticationFailedException::new);

        Instant now = Instant.now();
        codeDao.deleteExpired(now);
        String rawCode = SecureTokens.random(random);
        OAuthAuthorizationCode code = new OAuthAuthorizationCode();
        code.codeHash = SecureTokens.hash(rawCode);
        code.client = client;
        code.user = user;
        code.redirectUri = command.redirectUri;
        code.codeChallenge = command.codeChallenge;
        code.expiresAt = now.plus(CODE_LIFESPAN);
        codeDao.persist(code);
        return redirect(command.redirectUri, "code", rawCode, command.state);
    }

    @Transactional(dontRollbackOn = {OAuthException.class, AuthenticationFailedException.class})
    public Tokens token(OAuthTokenCommand command) {
        OAuthClient client = authenticateClient(command);
        if ("authorization_code".equals(command.grantType)) return exchangeCode(command, client);
        if ("refresh_token".equals(command.grantType)) {
            if (command.refreshToken == null) throw OAuthException.invalidRequest("refresh_token is required");
            try {
                return issueTokens(refreshTokenService.consume(command.refreshToken, client), client);
            } catch (AuthenticationFailedException e) {
                throw OAuthException.invalidGrant("Invalid or expired refresh token");
            }
        }
        throw new OAuthException(400, "unsupported_grant_type", "Supported grant types: authorization_code, refresh_token");
    }

    private Tokens exchangeCode(OAuthTokenCommand command, OAuthClient client) {
        if (command.code == null || command.codeVerifier == null) {
            throw OAuthException.invalidRequest("code and code_verifier are required");
        }
        OAuthAuthorizationCode code = codeDao.findByCodeHash(SecureTokens.hash(command.code));
        if (code == null) throw OAuthException.invalidGrant("Invalid or already used authorization code");
        // Single use, whatever happens next
        codeDao.delete(code);

        boolean valid = code.client.id.equals(client.id)
                && code.expiresAt.isAfter(Instant.now())
                && code.redirectUri.equals(command.redirectUri)
                && SecureTokens.equal(SecureTokens.pkceS256(command.codeVerifier), code.codeChallenge);
        if (!valid) throw OAuthException.invalidGrant("Invalid authorization code");
        return issueTokens((User) Hibernate.unproxy(code.user), client);
    }

    private Tokens issueTokens(User user, OAuthClient client) {
        return new Tokens(
                tokenProvider.generateToken(user.name, user.role),
                tokenProvider.lifespanSeconds(),
                refreshTokenService.issue(user, client));
    }

    // Public clients send just their client_id; confidential ones a secret, in the form or with HTTP Basic
    private OAuthClient authenticateClient(OAuthTokenCommand command) {
        String clientId = command.clientId;
        String secret = command.clientSecret;
        if (command.authorization != null && command.authorization.regionMatches(true, 0, "Basic ", 0, 6)) {
            String[] basic = decodeBasic(command.authorization.substring(6).trim());
            clientId = basic[0];
            secret = basic[1];
        }
        OAuthClient client = clientId == null ? null : clientDao.findByClientId(clientId);
        if (client == null) throw OAuthException.invalidClient("Unknown client");
        if (client.clientSecretHash != null
                && (secret == null || !SecureTokens.equal(SecureTokens.hash(secret), client.clientSecretHash))) {
            throw OAuthException.invalidClient("Invalid client credentials");
        }
        return client;
    }

    private static String[] decodeBasic(String encoded) {
        try {
            String decoded = new String(Base64.getDecoder().decode(encoded), StandardCharsets.UTF_8);
            int colon = decoded.indexOf(':');
            if (colon < 0) throw OAuthException.invalidClient("Malformed Basic credentials");
            // RFC 6749 2.3.1: both parts are form-urlencoded
            return new String[]{
                    java.net.URLDecoder.decode(decoded.substring(0, colon), StandardCharsets.UTF_8),
                    java.net.URLDecoder.decode(decoded.substring(colon + 1), StandardCharsets.UTF_8)};
        } catch (IllegalArgumentException e) {
            throw OAuthException.invalidClient("Malformed Basic credentials");
        }
    }

    private User authenticate(String username, String password) {
        if (username == null || password == null) throw new AuthenticationFailedException();
        User user = userDao.findByUsername(username).orElse(null);
        if (user == null || user.password == null || !BCrypt.checkpw(password, user.password)) {
            throw new AuthenticationFailedException();
        }
        return user;
    }

    // https anywhere; plain http only back to the user's own machine (desktop and CLI apps)
    private static void requireValidRedirectUri(String redirectUri) {
        try {
            URI uri = new URI(redirectUri);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            boolean loopback = host.equals("localhost") || host.equals("127.0.0.1") || host.equals("[::1]");
            boolean allowed = scheme.equals("https") && !host.isEmpty() || scheme.equals("http") && loopback;
            if (!allowed || uri.getFragment() != null) {
                throw new OAuthException(400, "invalid_redirect_uri",
                        "Redirect URIs must be https (or http on localhost) without a fragment: " + redirectUri);
            }
        } catch (URISyntaxException e) {
            throw new OAuthException(400, "invalid_redirect_uri", "Invalid redirect URI: " + redirectUri);
        }
    }

    private static String clientName(String name) {
        if (name == null || name.isBlank()) return null;
        String trimmed = name.trim();
        return trimmed.length() > MAX_CLIENT_NAME_LENGTH ? trimmed.substring(0, MAX_CLIENT_NAME_LENGTH) : trimmed;
    }

    private static String redirect(String redirectUri, String key, String value, String state) {
        StringBuilder url = new StringBuilder(redirectUri)
                .append(redirectUri.contains("?") ? '&' : '?')
                .append(key).append('=').append(encode(value));
        if (state != null) url.append("&state=").append(encode(state));
        return url.toString();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static OAuthException invalidClientMetadata(String description) {
        return new OAuthException(400, "invalid_client_metadata", description);
    }
}
