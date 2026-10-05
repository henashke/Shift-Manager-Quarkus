package commands;

import java.time.LocalDate;

public class DeleteShiftsByWeekCommand {
    public LocalDate weekStart;
    // Only this table's shifts; missing means the regular table
    public String specialTableName;
}

