package entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.List;

/**
 * An app (Claude, ChatGPT...) that registered itself to connect to the MCP server on its users' behalf.
 */
@Entity
@Table(name = "oauth_clients")
public class OAuthClient extends BaseEntity {

    @Column(name = "client_id", nullable = false)
    public String clientId;

    // Null for public clients, which prove themselves with PKCE only
    @Column(name = "client_secret_hash")
    public String clientSecretHash;

    @Column(name = "client_name")
    public String clientName;

    // One per line
    @Column(name = "redirect_uris", nullable = false)
    public String redirectUris;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    public List<String> redirectUriList() {
        return redirectUris.lines().filter(line -> !line.isBlank()).toList();
    }
}
