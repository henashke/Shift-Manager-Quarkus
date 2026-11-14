package entities;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "oauth_authorization_codes")
public class OAuthAuthorizationCode extends BaseEntity {

    @Column(name = "code_hash", nullable = false)
    public String codeHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    public OAuthClient client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    public User user;

    @Column(name = "redirect_uri", nullable = false)
    public String redirectUri;

    // The PKCE S256 challenge: base64url(SHA-256(code_verifier))
    @Column(name = "code_challenge", nullable = false)
    public String codeChallenge;

    @Column(name = "expires_at", nullable = false)
    public Instant expiresAt;
}
