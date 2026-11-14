package dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

// What the connect page shows about the app asking for access
@NoArgsConstructor
@AllArgsConstructor
@RegisterForReflection
public class OAuthClientInfoDto {
    public String name;
    // The host the user is sent back to, so they can tell which app it really is
    public String redirectHost;
}
