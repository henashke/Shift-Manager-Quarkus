package daos;

import entities.OAuthAuthorizationCode;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;

@ApplicationScoped
public class OAuthAuthorizationCodeDao implements BaseDao<OAuthAuthorizationCode> {

    public OAuthAuthorizationCode findByCodeHash(String codeHash) {
        return find("codeHash", codeHash).firstResult();
    }

    public void deleteExpired(Instant now) {
        delete("expiresAt < ?1", now);
    }
}
