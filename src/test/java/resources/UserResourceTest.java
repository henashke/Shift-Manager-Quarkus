package resources;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import entities.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import services.UserService;
import testsupport.BaseResourceTest;

import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class UserResourceTest extends BaseResourceTest {

    private UserService userService;
    private UserResource resource;

    @BeforeEach
    void setUp() {
        userService = Mockito.mock(UserService.class);
        resource = new UserResource();
        injectField(resource, "userService", userService);
    }

    @Test
    void list_returnsAll() {
        List<User> expected = List.of(newUser(1L), newUser(2L));
        when(userService.listAll()).thenReturn(expected);

        List<User> actual = resource.list();
        assertEquals(expected, actual);
        verify(userService).listAll();
    }

    @Test
    void get_returnsEntity_whenFound() {
        User u = newUser(7L);
        when(userService.findById(7L)).thenReturn(u);

        User actual = resource.get(7L);
        assertEquals(u, actual);
        verify(userService).findById(7L);
    }

    @Test
    void get_throwsNotFound_whenMissing() {
        when(userService.findById(9L)).thenReturn(null);
        assertThrows(NotFoundException.class, () -> resource.get(9L));
        verify(userService).findById(9L);
    }

    @Test
    void create_returns201_withEntity() {
        AddUserCommand cmd = new AddUserCommand();
        cmd.name = "Alice";
        cmd.password = "secret";
        cmd.score = 10;
        User created = newUser(3L);
        when(userService.create(cmd)).thenReturn(created);

        Response resp = resource.create(cmd);
        assertStatus(resp, Response.Status.CREATED.getStatusCode());
        assertEquals(created, resp.getEntity());
        verify(userService).create(cmd);
    }

    @Test
    void update_returnsEntity_whenFound() {
        UpdateUserCommand cmd = new UpdateUserCommand();
        cmd.name = "Bob";
        cmd.password = "pw";
        cmd.score = 5;
        User updated = newUser(4L);
        when(userService.update(any(UpdateUserCommand.class))).thenReturn(updated);

        User actual = resource.update(4L, cmd);
        assertEquals(4L, cmd.id);
        assertEquals(updated, actual);
        verify(userService).update(any(UpdateUserCommand.class));
    }

    @Test
    void update_throwsNotFound_whenMissing() {
        UpdateUserCommand cmd = new UpdateUserCommand();
        when(userService.update(any(UpdateUserCommand.class))).thenReturn(null);
        assertThrows(NotFoundException.class, () -> resource.update(11L, cmd));
        verify(userService).update(any(UpdateUserCommand.class));
    }

    @Test
    void delete_returns204() {
        Response resp = resource.delete(12L);
        assertStatus(resp, Response.Status.NO_CONTENT.getStatusCode());
        verify(userService).deleteById(12L);
    }

    private static User newUser(Long id) {
        User u = new User();
        u.id = id;
        u.name = "n" + id;
        u.password = "p" + id;
        u.score = id.intValue();
        return u;
    }
}
