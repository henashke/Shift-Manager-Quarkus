package resources;

import commands.OAuthAuthorizeCommand;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import responders.OAuthResponder;

/**
 * Called by the frontend's connect page, where a user approves a chat app. Public: a user who isn't signed in to the
 * web app sends their credentials instead of a Bearer token.
 */
@Path("/api/oauth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@PermitAll
public class OAuthConnectResource {

    @Inject
    OAuthResponder oauthResponder;

    @Inject
    SecurityIdentity identity;

    @GET
    @Path("/client")
    public Response client(@QueryParam("client_id") String clientId, @QueryParam("redirect_uri") String redirectUri) {
        return oauthResponder.clientInfo(clientId, redirectUri);
    }

    @POST
    @Path("/authorize")
    public Response authorize(OAuthAuthorizeCommand command) {
        return oauthResponder.approve(command, identity.isAnonymous() ? null : identity.getPrincipal().getName());
    }
}
