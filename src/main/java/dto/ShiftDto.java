package dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import enums.ShiftKind;
import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.Data;
import serializers.FlexibleLocalDateDeserializer;

import java.time.LocalDate;

@Data
@RegisterForReflection
public class ShiftDto {
    @JsonDeserialize(using = FlexibleLocalDateDeserializer.class)
    public LocalDate date;
    public String type;
    // Which role of the shift (regular, shadow, jump); missing means regular
    public ShiftKind kind;
}
