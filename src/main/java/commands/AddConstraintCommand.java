package commands;

import entities.Constraint;
import enums.ConstraintType;
import enums.ShiftType;

import java.time.LocalDate;

public class AddConstraintCommand extends AddCommand<Constraint> {
    public Long userId;
    public LocalDate date;
    public ShiftType type;
    public ConstraintType constraintType;
}
