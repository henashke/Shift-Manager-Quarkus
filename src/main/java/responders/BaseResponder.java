package responders;

import commands.AddCommand;
import commands.UpdateCommand;
import entities.BaseEntity;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import mappers.CommandToEntityMapper;
import services.BaseService;

import java.util.List;

public abstract class BaseResponder<T extends BaseEntity, AC extends AddCommand<T>, UC extends UpdateCommand<T>, D> {

    protected abstract BaseService<T> getService();

    protected abstract CommandToEntityMapper<T, AC, UC, D> getMapper();

    public D findById(Long id) {
        T entity = getService().findById(id);
        return entity != null ? getMapper().mapToDto(entity) : null;
    }

    public List<D> listAll() {
        return getMapper().mapToDto(getService().listAll());
    }

    @Transactional
    public D create(AC command) {
        T entity = getMapper().mapToEntity(command);
        getService().persist(entity);
        return getMapper().mapToDto(entity);
    }

    @Transactional
    public D update(Long id, UC command) {
        T entity = getService().findById(id);
        if (entity == null) {
            throw new NotFoundException("Entity not found with id: " + id);
        }
        getMapper().updateEntity(entity, command);
        return getMapper().mapToDto(entity);
    }

    @Transactional
    public void deleteById(Long id) {
        getService().deleteById(id);
    }
}
