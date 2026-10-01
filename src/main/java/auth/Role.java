package auth;

import lombok.Getter;

public enum Role {
    USER(RoleConstants.USER),
    ADMIN(RoleConstants.ADMIN);

    @Getter
    private final String roleName;

    Role(String roleName) {
        this.roleName = roleName;
    }
}

