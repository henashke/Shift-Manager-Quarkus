package dto;

import enums.Day;
import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Data;

@Data
@RegisterForReflection
public class ShiftWeightDto {
    public Day day;
    public String shiftType;
    public int weight;
}
