package resources;

import commands.AddShiftCommand;
import entities.Shift;
import enums.ShiftType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import services.ShiftService;
import testsupport.BaseResourceTest;

import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
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

    @Test
    void list_returnsAll() {
        List<Shift> expected = List.of(newShift(1L), newShift(2L));
        when(shiftService.listAll()).thenReturn(expected);

        List<Shift> actual = resource.list();
        assertEquals(expected, actual);
        verify(shiftService).listAll();
    }

    @Test
    void get_returnsEntity_whenFound() {
        Shift s = newShift(7L);
        when(shiftService.findById(7L)).thenReturn(s);

        Shift actual = resource.get(7L);
        assertEquals(s, actual);
        verify(shiftService).findById(7L);
    }

    @Test
    void get_throwsNotFound_whenMissing() {
        when(shiftService.findById(9L)).thenReturn(null);
        assertThrows(NotFoundException.class, () -> resource.get(9L));
        verify(shiftService).findById(9L);
    }

    @Test
    void create_returns201_withEntity() {
        AddShiftCommand cmd = new AddShiftCommand();
        cmd.date = LocalDate.now();
        cmd.type = ShiftType.DAY;
        Shift created = newShift(3L);
        when(shiftService.create(cmd)).thenReturn(created);

        Response resp = resource.create(cmd);
        assertStatus(resp, Response.Status.CREATED.getStatusCode());
        assertEquals(created, resp.getEntity());
        verify(shiftService).create(cmd);
    }

    @Test
    void delete_returns204() {
        Response resp = resource.delete(12L);
        assertStatus(resp, Response.Status.NO_CONTENT.getStatusCode());
        verify(shiftService).deleteById(12L);
    }

    private static Shift newShift(Long id) {
        Shift s = new Shift();
        s.id = id;
        s.date = LocalDate.now();
        s.type = ShiftType.DAY;
        return s;
    }
}
