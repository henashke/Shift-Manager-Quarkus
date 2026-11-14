package auth;

import io.vertx.ext.web.Router;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import lombok.RequiredArgsConstructor;
import util.PublicUrl;

/**
 * When the MCP endpoint turns a request away (401), tells the client where to find out how to sign in: the
 * resource_metadata parameter of WWW-Authenticate (RFC 9728), which MCP clients use to start the OAuth flow.
 */
@ApplicationScoped
@RequiredArgsConstructor
public class McpAuthChallenge {

    private final PublicUrl publicUrl;

    void addResourceMetadata(@Observes Router router) {
        router.route("/mcp*").order(Integer.MIN_VALUE).handler(context -> {
            context.addHeadersEndHandler(ignored -> {
                if (context.response().getStatusCode() != 401) return;
                String requestBase = context.request().scheme() + "://" + context.request().host();
                context.response().headers().set("WWW-Authenticate",
                        "Bearer resource_metadata=\"" + publicUrl.protectedResourceMetadata(requestBase) + "\"");
            });
            context.next();
        });
    }
}
