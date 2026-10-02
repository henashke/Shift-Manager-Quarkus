package dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Data;

import java.util.List;

@Data
@RegisterForReflection
public class ShiftWeightPresetDto {
    public String name;
    public List<ShiftWeightDto> weights;
}
