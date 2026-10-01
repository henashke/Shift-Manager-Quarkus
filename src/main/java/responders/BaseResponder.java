package responders;

import commands.AddCommand;
import commands.UpdateCommand;
import entities.BaseEntity;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.Response;
import mappers.DtoToCommandMapper;
import services.BaseService;

import java.util.List;

public abstract class BaseResponder<T extends BaseEntity, AC extends AddCommand<T>, UC extends UpdateCommand<T>, D> {

    protected abstract BaseService<T, AC, UC> getService();

    protected abstract DtoToCommandMapper<D, T, AC, UC> getDtoToCommandMapper();

    public List<D> listAll() {
        return getDtoToCommandMapper().mapToDto(getService().listAll());
    }

    @Transactional
    public Response create(D dto) {
        AC addCommand = getDtoToCommandMapper().mapToAddCommand(dto);
        T savedEntity = getService().create(addCommand);
        return Response.status(Response.Status.CREATED)
                .entity(getDtoToCommandMapper().mapToDto(savedEntity))
                .build();
    }

    @Transactional
    public Response createAll(List<D> dtos) {
        List<AC> commands = dtos.stream()
                .map(dto -> getDtoToCommandMapper().mapToAddCommand(dto))
                .toList();

        List<T> createdEntities = getService().createAll(commands);

        return Response.status(Response.Status.CREATED)
                .entity(createdEntities.stream()
                        .map(entity -> getDtoToCommandMapper().mapToDto(entity))
                        .toList())
                .build();
    }

    public Response ok(Object entity) {
        return Response.ok().entity(entity).build();
    }

    public Response ok() {
        return Response.ok().build();
    }
}
