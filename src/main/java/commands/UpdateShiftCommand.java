package commands;

import entities.Shift;
import enums.ShiftType;
import java.time.LocalDate;

public class UpdateShiftCommand extends UpdateCommand<Shift> {
    public LocalDate date;
    public ShiftType type;
}
