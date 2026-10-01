package dto;

import enums.Day;
import lombok.Data;

@Data
public class ShiftWeightDto {
    public Day day;
    public String shiftType;
    public int weight;
}
