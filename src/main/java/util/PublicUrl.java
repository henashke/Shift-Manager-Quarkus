package util;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Optional;

/**
 * The app's public base URL (e.g. https://shifts.example.com), used as the OAuth issuer and in the OAuth and MCP
 * metadata. Set app.public-url (APP_PUBLIC_URL) to pin it; otherwise it's taken from the request, which behind a proxy
 * relies on the X-Forwarded headers (see quarkus.http.proxy in application.properties).
 */
@ApplicationScoped
public class PublicUrl {

    @ConfigProperty(name = "app.public-url")
    Optional<String> configured;

    /**
     * @param requestBaseUrl scheme://host[:port] of the current request
     * @return the base URL without a trailing slash
     */
    public String resolve(String requestBaseUrl) {
        String base = configured.filter(url -> !url.isBlank()).orElse(requestBaseUrl);
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    public String mcpEndpoint(String requestBaseUrl) {
        return resolve(requestBaseUrl) + "/mcp";
    }

    public String protectedResourceMetadata(String requestBaseUrl) {
        return resolve(requestBaseUrl) + "/.well-known/oauth-protected-resource";
    }
}
