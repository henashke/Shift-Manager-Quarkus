package services;

import daos.RefreshTokenDao;
import entities.RefreshToken;
import entities.User;
import io.quarkus.security.AuthenticationFailedException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import entities.OAuthClient;
import util.SecureTokens;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;

/**
 * Long-lived, opaque refresh tokens. Only a SHA-256 hash of each token is stored. Tokens are single-use: every
 * refresh deletes the used token and issues a new one (rotation). A token belongs either to the web app or to one OAuth
 * client (a chat app connected over MCP), and only works there.
 */
@ApplicationScoped
@RequiredArgsConstructor
public class RefreshTokenService {

    // Not static: a static instance would be created during the native build and baked into the image with a fixed seed
    private final SecureRandom random = new SecureRandom();

    private final RefreshTokenDao dao;

    @ConfigProperty(name = "auth.refresh-token.lifespan-days", defaultValue = "30")
    int lifespanDays;

    // Longer for chat apps: each use renews it, so a connected app only needs the user again after this long unused
    @ConfigProperty(name = "auth.oauth.refresh-token.lifespan-days", defaultValue = "180")
    int oauthLifespanDays;

    /**
     * @return the raw token, to be handed to the client. It can't be recovered later.
     */
    @Transactional
    public String issue(User user) {
        return issue(user, null);
    }

    /**
     * @param oauthClient the chat app the token is for, or null for the web app
     * @return the raw token, to be handed to the client. It can't be recovered later.
     */
    @Transactional
    public String issue(User user, OAuthClient oauthClient) {
        Instant now = Instant.now();
        dao.deleteExpiredForUser(user, now);

        String rawToken = SecureTokens.random(random);
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.user = user;
        refreshToken.oauthClient = oauthClient;
        refreshToken.tokenHash = SecureTokens.hash(rawToken);
        refreshToken.expiresAt = now.plus(Duration.ofDays(oauthClient == null ? lifespanDays : oauthLifespanDays));
        dao.persist(refreshToken);
        return rawToken;
    }

    /**
     * Validates a web app token and invalidates it, so it can't be used again.
     *
     * @return the token's user
     * @throws AuthenticationFailedException if the token is unknown, already used, expired or an OAuth client's
     */
    @Transactional(dontRollbackOn = AuthenticationFailedException.class)
    public User consume(String rawToken) {
        return consume(rawToken, null);
    }

    /**
     * Validates the token and invalidates it, so it can't be used again.
     *
     * @param oauthClient the client presenting it (null: the web app); the token must have been issued to it
     * @return the token's user
     * @throws AuthenticationFailedException if the token is unknown, already used, expired or someone else's
     */
    @Transactional(dontRollbackOn = AuthenticationFailedException.class)
    public User consume(String rawToken, OAuthClient oauthClient) {
        if (rawToken == null || rawToken.isBlank()) throw new AuthenticationFailedException();
        RefreshToken refreshToken = dao.findByTokenHash(SecureTokens.hash(rawToken));
        if (refreshToken == null) throw new AuthenticationFailedException();

        // Initialize the lazy user while the session is open, so callers can use it after the transaction ends
        User user = (User) Hibernate.unproxy(refreshToken.user);
        boolean expired = refreshToken.expiresAt.isBefore(Instant.now());
        Long tokenClientId = refreshToken.oauthClient == null ? null : refreshToken.oauthClient.id;
        boolean otherClients = !Objects.equals(tokenClientId, oauthClient == null ? null : oauthClient.id);
        dao.delete(refreshToken);
        if (expired || otherClients) throw new AuthenticationFailedException();
        return user;
    }

    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        dao.deleteByTokenHash(SecureTokens.hash(rawToken));
    }

    // Signs the user out everywhere, e.g. after a password change
    @Transactional
    public void revokeAll(User user) {
        dao.deleteAllForUser(user);
    }
}
