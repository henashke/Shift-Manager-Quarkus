package dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

// OAuth protected resource metadata (RFC 9728): tells MCP clients which authorization server guards the MCP endpoint
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@RegisterForReflection
public class OAuthProtectedResourceDto {
    public String resource;
    public List<String> authorizationServers;
    public List<String> bearerMethodsSupported = List.of("header");
    public String resourceName = "Shift Manager";
}
