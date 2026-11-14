package daos;

import entities.OAuthClient;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class OAuthClientDao implements BaseDao<OAuthClient> {

    public OAuthClient findByClientId(String clientId) {
        return find("clientId", clientId).firstResult();
    }
}
