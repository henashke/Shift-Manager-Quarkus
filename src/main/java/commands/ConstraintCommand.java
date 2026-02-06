package commands;

import enums.ConstraintType;
import enums.ShiftType;

import java.time.LocalDate;

public class ConstraintCommand {
    public Long userId;
    public LocalDate date;
    public ShiftType type;
    public ConstraintType constraintType;
}


