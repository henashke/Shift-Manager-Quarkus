package enums;

/**
 * The role an assigned shift fills. Every shift (date + day/night) can have one of each. Shadow and jump are optional
 * extras an admin sets by hand: suggestions only ever fill the regular role. All three count toward the score.
 */
public enum ShiftKind {
    REGULAR("כונן"),
    SHADOW("כונן צל"),
    JUMP("כונן הקפצה");

    private final String hebrewName;

    ShiftKind(String hebrewName) {
        this.hebrewName = hebrewName;
    }

    public String getHebrewName() {
        return hebrewName;
    }

    // Requests from before the kinds existed have none, and mean the regular role
    public static ShiftKind orRegular(ShiftKind kind) {
        return kind != null ? kind : REGULAR;
    }
}
