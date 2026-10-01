package dto;

import lombok.Data;

import java.util.List;

@Data
public class ShiftWeightPresetDto {
    public String name;
    public List<ShiftWeightDto> weights;
}
