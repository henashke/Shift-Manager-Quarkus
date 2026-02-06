package commands;

import entities.ShiftWeight;
import entities.ShiftWeightPreset;
import java.util.List;

public class UpdateShiftWeightPresetCommand extends UpdateCommand<ShiftWeightPreset> {
    public String name;
    public List<ShiftWeight> shiftWeights;
}
