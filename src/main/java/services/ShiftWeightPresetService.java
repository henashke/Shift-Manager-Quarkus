package services;

import daos.BaseDao;
import daos.ShiftWeightPresetDao;
import entities.ShiftWeightPreset;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ShiftWeightPresetService extends BaseService<ShiftWeightPreset> {

    @Inject
    ShiftWeightPresetDao shiftWeightPresetDao;

    @Override
    protected BaseDao<ShiftWeightPreset> getDao() {
        return shiftWeightPresetDao;
    }
}
