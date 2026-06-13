package enums;

public enum ConstraintType {
    CANT("לא יכול"),
    PREFER("מעדיף"),
    PREFERS_NOT("מעדיף שלא");

    private final String hebrewRepresentation;

    ConstraintType(String hebrewRepresentation) {
        this.hebrewRepresentation = hebrewRepresentation;
    }

    public static ConstraintType fromValue(String value) {
        for (ConstraintType type : ConstraintType.values()) {
            if (type.hebrewRepresentation.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid constraint type: " + value);
    }

    public String getHebrewRepresentation() {
        return hebrewRepresentation;
    }

    public String getValue() {
        return hebrewRepresentation;
    }
}

