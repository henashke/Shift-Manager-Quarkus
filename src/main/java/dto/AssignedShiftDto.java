package dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@RegisterForReflection
public class AssignedShiftDto extends ShiftDto {
    public String assignedUsername;
    public ShiftWeightPresetDto preset;
}
