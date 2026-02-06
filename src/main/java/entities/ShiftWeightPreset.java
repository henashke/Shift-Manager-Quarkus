package entities;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shift_weight_presets")
public class ShiftWeightPreset extends BaseEntity {

    public String name;

    @OneToMany(mappedBy = "preset", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<ShiftWeight> shiftWeights = new ArrayList<>();
}
