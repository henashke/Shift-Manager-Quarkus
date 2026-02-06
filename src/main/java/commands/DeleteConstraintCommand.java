package commands;

import enums.ShiftType;

import java.time.LocalDate;

public class DeleteConstraintCommand {
    public Long userId;
    public LocalDate date;
    public ShiftType type;
}


