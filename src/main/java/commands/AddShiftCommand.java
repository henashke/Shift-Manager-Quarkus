package commands;

import entities.AssignedShift;
import enums.ShiftType;

import java.time.LocalDate;

public class AddShiftCommand extends AddCommand<AssignedShift> {
    public LocalDate date;
    public ShiftType type;
    public Long userId;
    public Long shiftWeightPresetId;
}
