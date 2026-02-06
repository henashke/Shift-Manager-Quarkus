package daos;

import entities.ShiftWeightPreset;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ShiftWeightPresetDao implements BaseDao<ShiftWeightPreset> {

    public ShiftWeightPreset findByName(String name) {
        return find("name", name).firstResult();
    }
}
