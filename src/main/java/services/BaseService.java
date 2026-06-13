package services;

import commands.AddCommand;
import commands.UpdateCommand;
import daos.BaseDao;
import entities.BaseEntity;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import mappers.CommandToEntityMapper;

import java.util.List;

public abstract class BaseService<ENTITY extends BaseEntity, AC extends AddCommand<ENTITY>, UC extends UpdateCommand<ENTITY>, DTO> {

    protected abstract BaseDao<ENTITY> getDao();

    protected abstract CommandToEntityMapper<ENTITY, AC, UC, DTO> getMapper();

    public ENTITY findById(Long id) {
        return getDao().findById(id);
    }

    public List<ENTITY> listAll() {
        return getDao().listAll();
    }

    public DTO findByIdDto(Long id) {
        ENTITY entity = findById(id);
        return entity != null ? getMapper().mapToDto(entity) : null;
    }

    public List<DTO> listAllDto() {
        return getMapper().mapToDto(getDao().listAll());
    }

    @Transactional
    public DTO createDto(AC addCommand) {
        ENTITY entity = getMapper().mapToEntity(addCommand);
        getDao().persist(entity);
        return getMapper().mapToDto(entity);
    }

    @Transactional
    public DTO updateDto(UC updateCommand) throws NotFoundException {
        ENTITY entity = getDao().findById(updateCommand.id);
        if (entity == null) {
            throw new NotFoundException("Could not find entity with id: " + updateCommand.id);
        }
        getMapper().updateEntity(entity, updateCommand);
        return getMapper().mapToDto(entity);
    }

    @Transactional
    public void deleteById(Long id) {
        getDao().deleteById(id);
    }
}
