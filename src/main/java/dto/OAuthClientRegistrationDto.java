package dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

// The registered client, as RFC 7591 returns it
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonInclude(JsonInclude.Include.NON_NULL)
@RegisterForReflection
public class OAuthClientRegistrationDto {
    public String clientId;
    public String clientSecret;
    public Long clientIdIssuedAt;
    // 0: the secret doesn't expire (only sent with a secret)
    public Long clientSecretExpiresAt;
    public String clientName;
    public List<String> redirectUris;
    public String tokenEndpointAuthMethod;
    public List<String> grantTypes;
    public List<String> responseTypes;
}
