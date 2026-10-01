package enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.time.LocalDate;

public enum Day {
    SUNDAY("ראשון"),
    MONDAY("שני"),
    TUESDAY("שלישי"),
    WEDNESDAY("רביעי"),
    THURSDAY("חמישי"),
    FRIDAY("שישי"),
    SATURDAY("שבת");

    private final String hebrewName;

    Day(String hebrewName) {
        this.hebrewName = hebrewName;
    }

    public static Day fromDate(LocalDate date) {
        return values()[date.getDayOfWeek().getValue() % 7];
    }

    @JsonCreator
    public static Day fromHebrewName(String name) {
        for (Day day : values()) {
            if (day.hebrewName.equals(name)) {
                return day;
            }
        }
        throw new IllegalArgumentException("Unknown Hebrew day: " + name);
    }

    @JsonValue
    public String getHebrewName() {
        return hebrewName;
    }

    @Override
    public String toString() {
        return hebrewName;
    }
}
