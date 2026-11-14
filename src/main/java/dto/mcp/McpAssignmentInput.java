package dto.mcp;

import enums.ShiftKind;
import enums.ShiftType;
import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * One assignment to save, as the assign_shifts tool takes it.
 *
 * @param date   YYYY-MM-DD
 * @param role   REGULAR when missing
 */
@RegisterForReflection
public record McpAssignmentInput(String date, ShiftType shift, String person, ShiftKind role) {
}
