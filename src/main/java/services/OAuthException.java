package services;

import lombok.Getter;

/**
 * An OAuth protocol error, with its RFC 6749 / RFC 7591 error code (invalid_request, invalid_grant...).
 */
@Getter
public class OAuthException extends RuntimeException {

    private final int status;
    private final String error;

    public OAuthException(int status, String error, String description) {
        super(description);
        this.status = status;
        this.error = error;
    }

    public static OAuthException invalidRequest(String description) {
        return new OAuthException(400, "invalid_request", description);
    }

    public static OAuthException invalidGrant(String description) {
        return new OAuthException(400, "invalid_grant", description);
    }

    public static OAuthException invalidClient(String description) {
        return new OAuthException(401, "invalid_client", description);
    }
}
