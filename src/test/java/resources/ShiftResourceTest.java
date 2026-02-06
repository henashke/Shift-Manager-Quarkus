package resources;

import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import entities.AssignedShift;
import enums.ShiftType;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import services.ShiftService;
import testsupport.BaseResourceTest;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

public class ShiftResourceTest extends BaseResourceTest {

    private ShiftService shiftService;
    private ShiftResource resource;

    @BeforeEach
    void setUp() {
        shiftService = Mockito.mock(ShiftService.class);
        resource = new ShiftResource();
        injectField(resource, "shiftService", shiftService);
    }

    private static AssignedShift newAssignedShift(Long id) {
        AssignedShift s = new AssignedShift();
        s.id = id;
        s.date = LocalDate.now();
        s.type = ShiftType.DAY;
        return s;
    }

    @Test
    void list_returnsAll() {
        List<AssignedShift> expected = List.of(newAssignedShift(1L), newAssignedShift(2L));
        when(shiftService.listAll()).thenReturn(expected);

        List<AssignedShift> actual = resource.list();
        assertEquals(expected, actual);
        verify(shiftService).listAll();
    }

    @Test
    void get_throwsNotFound_whenMissing() {
        when(shiftService.findById(9L)).thenReturn(null);
        assertThrows(NotFoundException.class, () -> resource.get(9L));
        verify(shiftService).findById(9L);
    }

    @Test
    void get_returnsEntity_whenFound() {
        AssignedShift s = newAssignedShift(7L);
        when(shiftService.findById(7L)).thenReturn(s);

        AssignedShift actual = resource.get(7L);
        assertEquals(s, actual);
        verify(shiftService).findById(7L);
    }

    @Test
    void create_returns201_withEntity() {
        AddShiftCommand cmd = new AddShiftCommand();
        cmd.date = LocalDate.now();
        cmd.type = ShiftType.DAY;
        cmd.userId = 1L;
        AssignedShift created = newAssignedShift(3L);
        when(shiftService.create(cmd)).thenReturn(created);

        Response resp = resource.create(cmd);
        assertStatus(resp, Response.Status.CREATED.getStatusCode());
        assertEquals(created, resp.getEntity());
        verify(shiftService).create(cmd);
    }

    @Test
    void update_returnsEntity_whenFound() {
        UpdateShiftCommand cmd = new UpdateShiftCommand();
        cmd.userId = 2L;
        AssignedShift updated = newAssignedShift(4L);
        when(shiftService.update(any(UpdateShiftCommand.class))).thenReturn(updated);

        AssignedShift actual = resource.update(4L, cmd);
        assertEquals(4L, cmd.id);
        assertEquals(updated, actual);
        verify(shiftService).update(any(UpdateShiftCommand.class));
    }

    @Test
    void delete_returns204() {
        Response resp = resource.delete(12L);
        assertStatus(resp, Response.Status.NO_CONTENT.getStatusCode());
        verify(shiftService).deleteById(12L);
    }

    @Test
    void update_throwsNotFound_whenMissing() {
        UpdateShiftCommand cmd = new UpdateShiftCommand();
        when(shiftService.update(any(UpdateShiftCommand.class))).thenReturn(null);
        assertThrows(NotFoundException.class, () -> resource.update(11L, cmd));
        verify(shiftService).update(any(UpdateShiftCommand.class));
    }
}
