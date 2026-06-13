package auth;

import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;
import java.util.Set;

@ApplicationScoped
public class JwtTokenProvider {
    @ConfigProperty(name = "mp.jwt.verify.issuer", defaultValue = "my-app")
    String issuer;
    @ConfigProperty(name = "smallrye.jwt.new-token.lifespan", defaultValue = "3600")
    String tokenLifespan; // todo change to something like 15 secs and implement refresh token logic


    public String generateToken(String username, String role) {
        return Jwt.issuer(issuer)
                .upn(username)
                .groups(Set.of(role))
                .claim(JwtClaims.USERNAME, username)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(Integer.parseInt(tokenLifespan)))
                .sign();
    }
}