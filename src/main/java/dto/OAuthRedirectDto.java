package dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

// Where the connect page sends the browser next: back to the chat app, with a code or an error
@NoArgsConstructor
@AllArgsConstructor
@RegisterForReflection
public class OAuthRedirectDto {
    public String redirectUrl;
}
