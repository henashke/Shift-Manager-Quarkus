package entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import enums.Day;
import enums.ShiftType;
import jakarta.persistence.*;

@Entity
@Table(name = "shift_weights")
public class ShiftWeight extends BaseEntity {

    @Enumerated(EnumType.STRING)
    public Day day;

    @Enumerated(EnumType.STRING)
    public ShiftType shiftType;

    public int weight;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preset_id")
    public ShiftWeightPreset preset;
}
