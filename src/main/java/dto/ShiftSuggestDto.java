package dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.quarkus.runtime.annotations.RegisterForReflection;
import serializers.FlexibleLocalDateDeserializer;

import java.time.LocalDate;
import java.util.List;

@RegisterForReflection
public class ShiftSuggestDto {
    public List<String> userIds; // usernames
    @JsonDeserialize(using = FlexibleLocalDateDeserializer.class)
    public LocalDate startDate;
    @JsonDeserialize(using = FlexibleLocalDateDeserializer.class)
    public LocalDate endDate;
}
