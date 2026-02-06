package enums;

public enum ShiftType {
    DAY("יום"),
    NIGHT("לילה");

    private final String hebrewRepresentation;

    ShiftType(String hebrewRepresentation) {
        this.hebrewRepresentation = hebrewRepresentation;
    }

    public String getHebrewRepresentation() {
        return hebrewRepresentation;
    }
}
