package services;

import commands.AddCommand;
import commands.UpdateCommand;
import daos.BaseDao;
import entities.BaseEntity;
import jakarta.transaction.Transactional;
import java.util.List;

public abstract class BaseService<T extends BaseEntity, AC extends AddCommand<T>, UC extends UpdateCommand<T>> {

    protected abstract BaseDao<T> getDao();

    protected abstract T mapToEntity(AC addCommand);

    protected abstract void updateEntity(T entity, UC updateCommand);

    public T findById(Long id) {
        return getDao().findById(id);
    }

    public List<T> listAll() {
        return getDao().listAll();
    }

    @Transactional
    public T create(AC addCommand) {
        T entity = mapToEntity(addCommand);
        getDao().persist(entity);
        return entity;
    }

    @Transactional
    public T update(UC updateCommand) {
        T entity = getDao().findById(updateCommand.id);
        if (entity == null) {
            return null;
        }
        updateEntity(entity, updateCommand);
        return entity;
    }

    @Transactional
    public void deleteById(Long id) {
        getDao().deleteById(id);
    }
}
