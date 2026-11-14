package resources;

import commands.OAuthTokenCommand;
import commands.RegisterOAuthClientCommand;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import responders.OAuthResponder;

/**
 * The OAuth endpoints chat apps call to connect to the MCP server (see OAuthService). All public.
 */
@Path("/oauth")
@PermitAll
public class OAuthResource {

    @Inject
    OAuthResponder oauthResponder;

    @POST
    @Path("/register")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response register(RegisterOAuthClientCommand command) {
        return oauthResponder.register(command);
    }

    @GET
    @Path("/authorize")
    public Response authorize(@Context UriInfo uriInfo) {
        return oauthResponder.authorize(uriInfo);
    }

    @POST
    @Path("/token")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MediaType.APPLICATION_JSON)
    public Response token(@BeanParam OAuthTokenCommand command) {
        return oauthResponder.token(command);
    }
}
