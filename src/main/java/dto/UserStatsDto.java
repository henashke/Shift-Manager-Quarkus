package dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.time.LocalDate;

// One user's numbers on the stats page; counts are regular shifts up to today unless named otherwise
@RegisterForReflection
public class UserStatsDto {
    public String name;
    public boolean reserve;
    // Null when the user hasn't had a shift yet
    public LocalDate firstShiftDate;
    public long daysSinceFirstShift;
    // Since January 1st
    public int shiftsThisYear;
    public int shiftsAllTime;
    public int shiftsLast30Days;
    public int dayShifts;
    public int nightShifts;
    // On Friday or Saturday
    public int weekendShifts;
    public int shadowShifts;
    public int jumpShifts;
}
