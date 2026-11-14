package dto.mcp;

/**
 * Who's calling an MCP tool: the user of the chat app's access token.
 */
public record McpCaller(String username, boolean admin) {
}
