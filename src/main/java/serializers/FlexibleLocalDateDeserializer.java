package serializers;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

import java.io.IOException;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class FlexibleLocalDateDeserializer extends StdDeserializer<LocalDate> {

    public FlexibleLocalDateDeserializer() {
        super(LocalDate.class);
    }

    @Override
    public LocalDate deserialize(JsonParser p, DeserializationContext ctx) throws IOException {
        String value = p.getText();
        try {
            return LocalDate.parse(value);
        } catch (Exception e) {
            return OffsetDateTime.parse(value).toLocalDate();
        }
    }
}
