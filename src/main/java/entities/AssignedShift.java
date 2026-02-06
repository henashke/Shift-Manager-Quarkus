package entities;

import jakarta.persistence.*;

@Entity
@Table(name = "assigned_shifts")
public class AssignedShift extends Shift {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    public User assignedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preset_id")
    public ShiftWeightPreset shiftWeightPreset;

}
