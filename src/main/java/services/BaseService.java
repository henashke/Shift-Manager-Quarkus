package services;

import commands.AddCommand;
import commands.UpdateCommand;
import daos.BaseDao;
import entities.BaseEntity;
import mappers.CommandToEntityMapper;
import jakarta.transaction.Transactional;
import java.util.List;

public abstract class BaseService<T extends BaseEntity, AC extends AddCommand<T>, UC extends UpdateCommand<T>> {

    protected abstract BaseDao<T> getDao();

    protected abstract CommandToEntityMapper<T, AC, UC> getMapper();

    public T findById(Long id) {
        return getDao().findById(id);
    }

    public List<T> listAll() {
        return getDao().listAll();
    }

    @Transactional
    public T create(AC addCommand) {
        T entity = getMapper().mapToEntity(addCommand);
        getDao().persist(entity);
        return entity;
    }

    @Transactional
    public T update(UC updateCommand) {
        T entity = getDao().findById(updateCommand.id);
        if (entity == null) {
            return null;
        }
        getMapper().updateEntity(entity, updateCommand);
        return entity;
    }

    @Transactional
    public void deleteById(Long id) {
        getDao().deleteById(id);
    }
}
