package dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.quarkus.runtime.annotations.RegisterForReflection;
import serializers.FlexibleLocalDateDeserializer;

import java.time.LocalDate;

@RegisterForReflection
public class DeleteConstraintDto {
    public String userId;    // username
    @JsonDeserialize(using = FlexibleLocalDateDeserializer.class)
    public LocalDate date;
    public String shiftType; // Hebrew
}
