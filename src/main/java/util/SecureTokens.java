package util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Random opaque tokens (refresh tokens, OAuth codes and secrets) and the SHA-256 hashes they're stored as.
 */
public final class SecureTokens {

    private SecureTokens() {
    }

    /**
     * @param random owned by the caller (an instance field of a bean), never a static one: a static instance would be
     *               created during the native build and baked into the image with a fixed seed
     * @return 32 random bytes, base64url-encoded without padding
     */
    public static String random(SecureRandom random) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * @return the SHA-256 of the token's UTF-8 bytes, as lowercase hex
     */
    public static String hash(String token) {
        return HexFormat.of().formatHex(sha256(token));
    }

    /**
     * @return base64url(SHA-256(value)) without padding, the PKCE S256 transformation
     */
    public static String pkceS256(String codeVerifier) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(sha256(codeVerifier));
    }

    /**
     * Compares in constant time, so the comparison doesn't leak how much of a secret matched.
     */
    public static boolean equal(String a, String b) {
        if (a == null || b == null) return false;
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
