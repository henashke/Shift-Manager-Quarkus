package resources;

import dto.OAuthProtectedResourceDto;
import dto.OAuthServerMetadataDto;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.UriInfo;
import responders.OAuthResponder;

/**
 * Discovery documents MCP clients read to find out how to sign in: the MCP endpoint's protected resource metadata
 * (also under the endpoint's path, per RFC 9728) and the authorization server metadata.
 */
@Path("/.well-known")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class WellKnownResource {

    @Inject
    OAuthResponder oauthResponder;

    @GET
    @Path("/oauth-protected-resource")
    public OAuthProtectedResourceDto protectedResource(@Context UriInfo uriInfo) {
        return oauthResponder.protectedResourceMetadata(uriInfo);
    }

    @GET
    @Path("/oauth-protected-resource/mcp")
    public OAuthProtectedResourceDto mcpProtectedResource(@Context UriInfo uriInfo) {
        return oauthResponder.protectedResourceMetadata(uriInfo);
    }

    @GET
    @Path("/oauth-authorization-server")
    public OAuthServerMetadataDto authorizationServer(@Context UriInfo uriInfo) {
        return oauthResponder.serverMetadata(uriInfo);
    }
}
