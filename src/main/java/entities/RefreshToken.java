package entities;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    public User user;

    @Column(name = "token_hash", nullable = false)
    public String tokenHash;

    @Column(name = "expires_at", nullable = false)
    public Instant expiresAt;
}
