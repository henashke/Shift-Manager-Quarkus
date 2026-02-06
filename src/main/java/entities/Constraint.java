package entities;

import enums.ConstraintType;
import enums.ShiftType;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "constraints")
public class Constraint extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    public User user;

    @Column(name = "shift_date", nullable = false)
    public LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(name = "shift_type", nullable = false)
    public ShiftType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "constraint_type", nullable = false)
    public ConstraintType constraintType;
}


