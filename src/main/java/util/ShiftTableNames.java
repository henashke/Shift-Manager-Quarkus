package util;

import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.core.Response;

import static responders.ErrorResponses.error;

/**
 * Names of extra shift tables (a week's additional schedules). A missing or blank name means the regular table.
 */
public final class ShiftTableNames {

    public static final int MAX_LENGTH = 50;
    // What the client calls the regular table, so no extra table may use it
    private static final String REGULAR_LABEL = "רגיל";

    private ShiftTableNames() {
    }

    /**
     * @return the trimmed name, or null for the regular table
     * @throws BadRequestException for a name that's reserved or too long
     */
    public static String normalize(String name) {
        if (name == null || name.isBlank()) return null;
        String trimmed = name.trim();
        if (trimmed.equals(REGULAR_LABEL)) {
            throw new BadRequestException(error(Response.Status.BAD_REQUEST, "השם \"" + REGULAR_LABEL + "\" שמור לטבלה הרגילה"));
        }
        if (trimmed.length() > MAX_LENGTH) {
            throw new BadRequestException(error(Response.Status.BAD_REQUEST, "שם הטבלה ארוך מדי (עד " + MAX_LENGTH + " תווים)"));
        }
        return trimmed;
    }
}
