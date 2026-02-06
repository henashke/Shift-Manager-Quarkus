package commands;

import entities.Shift;
import enums.ShiftType;
import java.time.LocalDate;

public class AddShiftCommand extends AddCommand<Shift> {
    public LocalDate date;
    public ShiftType type;
}
