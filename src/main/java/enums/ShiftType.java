package enums;

public enum ShiftType {
    DAY("יום"),
    NIGHT("לילה");

    private final String hebrewRepresentation;

    public static ShiftType fromHebrew(String value) {
        for (ShiftType type : ShiftType.values()) {
            if (type.hebrewRepresentation.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid shift type: " + value);
    }

    ShiftType(String hebrewRepresentation) {
        this.hebrewRepresentation = hebrewRepresentation;
    }

}
