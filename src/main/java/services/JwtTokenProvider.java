package services;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@ApplicationScoped
public class JwtTokenProvider {

    @ConfigProperty(name = "app.jwt.secret", defaultValue = "your-secret-key-should-be-at-least-32-chars-long")
    String jwtSecret;

    @ConfigProperty(name = "app.jwt.issuer", defaultValue = "shift-manager")
    String jwtIssuer;

    @ConfigProperty(name = "app.jwt.expiration-hours", defaultValue = "24")
    int expirationHours;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(String username, String role) {
        Instant now = Instant.now();
        Instant expiryTime = now.plus(expirationHours, ChronoUnit.HOURS);

        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuer(jwtIssuer)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiryTime))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (Exception e) {
            return null;
        }
    }

    public String getRoleFromToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .get("role", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

