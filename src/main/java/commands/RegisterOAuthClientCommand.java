package commands;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

/**
 * An OAuth dynamic client registration request (RFC 7591), sent by the chat app itself. Unknown fields are ignored.
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@RegisterForReflection
public class RegisterOAuthClientCommand {
    public List<String> redirectUris;
    public String clientName;
    // "none" (public client, the default), "client_secret_post" or "client_secret_basic"
    public String tokenEndpointAuthMethod;
    public List<String> grantTypes;
    public List<String> responseTypes;
}
