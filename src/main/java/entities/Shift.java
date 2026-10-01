package entities;

import enums.ShiftType;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.MappedSuperclass;

import java.time.LocalDate;

@MappedSuperclass
public abstract class Shift extends BaseEntity {

    @Column(name = "date")
    public LocalDate date;

    @Column(name = "type")
    @Enumerated(EnumType.STRING)
    public ShiftType type;

}
