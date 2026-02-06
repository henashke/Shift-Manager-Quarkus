package resources;

import commands.AddShiftWeightPresetCommand;
import entities.ShiftWeightPreset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import services.ShiftWeightPresetService;
import testsupport.BaseResourceTest;

import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class ShiftWeightPresetResourceTest extends BaseResourceTest {

    private ShiftWeightPresetService service;
    private ShiftWeightPresetResource resource;

    @BeforeEach
    void setUp() {
        service = Mockito.mock(ShiftWeightPresetService.class);
        resource = new ShiftWeightPresetResource();
        injectField(resource, "shiftWeightPresetService", service);
    }

    @Test
    void list_returnsAll() {
        List<ShiftWeightPreset> expected = List.of(newPreset(1L), newPreset(2L));
        when(service.listAll()).thenReturn(expected);

        List<ShiftWeightPreset> actual = resource.list();
        assertEquals(expected, actual);
        verify(service).listAll();
    }

    @Test
    void get_returnsEntity_whenFound() {
        ShiftWeightPreset p = newPreset(7L);
        when(service.findById(7L)).thenReturn(p);

        ShiftWeightPreset actual = resource.get(7L);
        assertEquals(p, actual);
        verify(service).findById(7L);
    }

    @Test
    void get_throwsNotFound_whenMissing() {
        when(service.findById(9L)).thenReturn(null);
        assertThrows(NotFoundException.class, () -> resource.get(9L));
        verify(service).findById(9L);
    }

    @Test
    void create_returns201_withEntity() {
        AddShiftWeightPresetCommand cmd = new AddShiftWeightPresetCommand();
        cmd.name = "Preset";
        cmd.shiftWeights = new ArrayList<>();
        ShiftWeightPreset created = newPreset(3L);
        when(service.create(cmd)).thenReturn(created);

        Response resp = resource.create(cmd);
        assertStatus(resp, Response.Status.CREATED.getStatusCode());
        assertEquals(created, resp.getEntity());
        verify(service).create(cmd);
    }

    @Test
    void delete_returns204() {
        Response resp = resource.delete(12L);
        assertStatus(resp, Response.Status.NO_CONTENT.getStatusCode());
        verify(service).deleteById(12L);
    }

    private static ShiftWeightPreset newPreset(Long id) {
        ShiftWeightPreset p = new ShiftWeightPreset();
        p.id = id;
        p.name = "p" + id;
        p.shiftWeights = new ArrayList<>();
        return p;
    }
}
