package entities;

import enums.ShiftKind;
import jakarta.persistence.*;

@Entity
@Table(name = "assigned_shifts")
public class AssignedShift extends Shift {

    @ManyToOne
    @JoinColumn(name = "user_id")
    public User assignedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preset_id")
    public ShiftWeightPreset shiftWeightPreset;

    @Column(name = "kind", nullable = false)
    @Enumerated(EnumType.STRING)
    public ShiftKind kind = ShiftKind.REGULAR;

    // An extra table of the week (another real schedule next to the regular one); null is the regular table
    @Column(name = "special_table_name")
    public String specialTableName;

}
