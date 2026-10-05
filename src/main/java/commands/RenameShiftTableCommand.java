package commands;

import java.time.LocalDate;

// Renames one extra table of a week (all its shifts that week)
public class RenameShiftTableCommand {
    public LocalDate weekStart;
    public String from;
    public String to;
}
