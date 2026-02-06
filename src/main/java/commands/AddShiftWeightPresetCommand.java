package commands;

import entities.ShiftWeight;
import entities.ShiftWeightPreset;
import java.util.List;

public class AddShiftWeightPresetCommand extends AddCommand<ShiftWeightPreset> {
    public String name;
    public List<ShiftWeight> shiftWeights;
}
