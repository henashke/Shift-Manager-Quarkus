package enums;

public enum ConstraintType {
    CANT("לא יכול"),
    PREFER("מעדיף"),
    PREFERS_NOT("מעדיף שלא");

    private final String value;

    ConstraintType(String value) {
        this.value = value;
    }

    public static ConstraintType fromValue(String value) {
        for (ConstraintType type : ConstraintType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid constraint type: " + value);
    }

    public String getValue() {
        return value;
    }
}

