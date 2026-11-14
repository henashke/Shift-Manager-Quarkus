package util;

/**
 * Rules for usernames. A name with whitespace at either end (like "Varvara ") looks the same as the name without it but
 * is a different user to sign-in and lookups, so new names may not have it.
 */
public final class UserNames {

    public static final String EDGE_WHITESPACE_ERROR = "שם המשתמש לא יכול להתחיל או להסתיים ברווח";

    private UserNames() {
    }

    public static boolean hasEdgeWhitespace(String name) {
        if (name == null || name.isEmpty()) return false;
        return isSpace(name.codePointAt(0)) || isSpace(name.codePointBefore(name.length()));
    }

    // Like the browser's trim(), which the signup form checks with: also no-break spaces, which isWhitespace leaves out
    private static boolean isSpace(int codePoint) {
        return Character.isWhitespace(codePoint) || Character.isSpaceChar(codePoint);
    }
}
