package dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

// OAuth authorization server metadata (RFC 8414)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@RegisterForReflection
public class OAuthServerMetadataDto {
    public String issuer;
    public String authorizationEndpoint;
    public String tokenEndpoint;
    public String registrationEndpoint;
    public List<String> responseTypesSupported = List.of("code");
    public List<String> grantTypesSupported = List.of("authorization_code", "refresh_token");
    public List<String> codeChallengeMethodsSupported = List.of("S256");
    public List<String> tokenEndpointAuthMethodsSupported = List.of("none", "client_secret_post", "client_secret_basic");
}
