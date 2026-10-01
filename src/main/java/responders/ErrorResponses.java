package responders;

import dto.ErrorDto;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

public final class ErrorResponses {

    private ErrorResponses() {
    }

    public static Response error(Response.Status status, String message) {
        return Response.status(status)
                .type(MediaType.APPLICATION_JSON)
                .entity(new ErrorDto(message))
                .build();
    }
}
