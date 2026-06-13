package dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ShiftDto {
    public LocalDate date;
    public String type;
}
