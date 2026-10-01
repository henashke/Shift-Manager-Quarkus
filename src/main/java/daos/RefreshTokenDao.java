package daos;

import entities.RefreshToken;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;

@ApplicationScoped
public class RefreshTokenDao implements BaseDao<RefreshToken> {

    public RefreshToken findByTokenHash(String tokenHash) {
        return find("tokenHash", tokenHash).firstResult();
    }

    public void deleteByTokenHash(String tokenHash) {
        delete("tokenHash", tokenHash);
    }

    public void deleteExpiredForUser(User user, Instant now) {
        delete("user = ?1 and expiresAt < ?2", user, now);
    }
}
