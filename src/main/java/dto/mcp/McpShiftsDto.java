package dto.mcp;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

/**
 * Assignments a tool saved or proposed (a tool returning a bare list would send each item as its own content block).
 *
 * @param note what the model should know about them, e.g. that a suggestion isn't saved yet
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@RegisterForReflection
public record McpShiftsDto(String note, List<McpShiftDto> shifts) {
}
