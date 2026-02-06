package testsupport;

import jakarta.ws.rs.core.Response;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;

public abstract class BaseResourceTest {

    protected void injectField(Object target, String fieldName, Object value) {
        try {
            Field f = target.getClass().getDeclaredField(fieldName);
            f.setAccessible(true);
            f.set(target, value);
        } catch (NoSuchFieldException e) {
            // try superclass if field declared there
            try {
                Field f = target.getClass().getSuperclass().getDeclaredField(fieldName);
                f.setAccessible(true);
                f.set(target, value);
            } catch (Exception ex) {
                throw new RuntimeException(ex);
            }
        } catch (IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }

    protected void assertStatus(Response response, int expectedStatus) {
        assertNotNull(response, "Response should not be null");
        assertEquals(expectedStatus, response.getStatus());
    }
}
