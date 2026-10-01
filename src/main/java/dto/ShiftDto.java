package dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.Data;
import serializers.FlexibleLocalDateDeserializer;

import java.time.LocalDate;

@Data
public class ShiftDto {
    @JsonDeserialize(using = FlexibleLocalDateDeserializer.class)
    public LocalDate date;
    public String type;
}
