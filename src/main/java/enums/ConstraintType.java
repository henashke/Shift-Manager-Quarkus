package enums;

public enum ConstraintType {
    CANT("CANT"),
    PREFER("PREFER");

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

