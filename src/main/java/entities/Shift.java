package entities;

import enums.ShiftType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "shifts")
public class Shift extends BaseEntity {

    public LocalDate date;

    @Enumerated(EnumType.STRING)
    public ShiftType type;

}
