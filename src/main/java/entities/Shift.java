package entities;

import enums.ShiftType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.LocalDate;

public abstract class Shift extends BaseEntity {

    public LocalDate date;

    @Enumerated(EnumType.STRING)
    public ShiftType type;

}
