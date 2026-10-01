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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Long-lived, opaque refresh tokens. Only a SHA-256 hash of each token is stored. Tokens are single-use: every
 * refresh deletes the used token and issues a new one (rotation).
 */
@ApplicationScoped
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final RefreshTokenDao dao;

    @ConfigProperty(name = "auth.refresh-token.lifespan-days", defaultValue = "30")
    int lifespanDays;

    /**
     * @return the raw token, to be handed to the client. It can't be recovered later.
     */
    @Transactional
    public String issue(User user) {
        Instant now = Instant.now();
        dao.deleteExpiredForUser(user, now);

        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.user = user;
        refreshToken.tokenHash = hash(rawToken);
        refreshToken.expiresAt = now.plus(Duration.ofDays(lifespanDays));
        dao.persist(refreshToken);
        return rawToken;
    }

    /**
     * Validates the token and invalidates it, so it can't be used again.
     *
     * @return the token's user
     * @throws AuthenticationFailedException if the token is unknown, already used or expired
     */
    @Transactional(dontRollbackOn = AuthenticationFailedException.class)
    public User consume(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) throw new AuthenticationFailedException();
        RefreshToken refreshToken = dao.findByTokenHash(hash(rawToken));
        if (refreshToken == null) throw new AuthenticationFailedException();

        // Initialize the lazy user while the session is open, so callers can use it after the transaction ends
        User user = (User) Hibernate.unproxy(refreshToken.user);
        boolean expired = refreshToken.expiresAt.isBefore(Instant.now());
        dao.delete(refreshToken);
        if (expired) throw new AuthenticationFailedException();
        return user;
    }

    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        dao.deleteByTokenHash(hash(rawToken));
    }

    private static String hash(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
