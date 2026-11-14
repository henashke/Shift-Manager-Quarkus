package dto.mcp;

import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * @param score the fairness score: the weighted sum of the user's shifts (higher means they've done more)
 */
@RegisterForReflection
public record McpUserDto(String name, String role, boolean reserve, Integer score) {
}
