package commands;

import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * Sent by the frontend's connect page once the user approves (or declines) a chat app. Carries the query parameters of
 * the app's /oauth/authorize request, plus the user's credentials unless they're already signed in (Bearer token).
 */
@RegisterForReflection
public class OAuthAuthorizeCommand {
    public String clientId;
    public String redirectUri;
    public String responseType;
    public String codeChallenge;
    public String codeChallengeMethod;
    public String state;
    public boolean approve;
    public String username;
    public String password;
}
