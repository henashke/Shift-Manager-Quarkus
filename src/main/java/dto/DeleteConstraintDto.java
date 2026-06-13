package dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import serializers.FlexibleLocalDateDeserializer;

import java.time.LocalDate;

public class DeleteConstraintDto {
    public String userId;    // username
    @JsonDeserialize(using = FlexibleLocalDateDeserializer.class)
    public LocalDate date;
    public String shiftType; // Hebrew
}
