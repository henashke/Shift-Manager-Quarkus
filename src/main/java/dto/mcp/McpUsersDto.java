package dto.mcp;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

@RegisterForReflection
public record McpUsersDto(List<McpUserDto> users) {
}
