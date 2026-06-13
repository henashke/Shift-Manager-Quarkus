package services;

import commands.AddCommand;
import commands.UpdateCommand;
import daos.BaseDao;
import entities.BaseEntity;
import jakarta.transaction.Transactional;
import mappers.CommandToEntityMapper;

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
    public T create(AC command) {
        T entity = getMapper().mapToEntity(command);
        persist(entity);
        return entity;
    }

    public List<T> createAll(List<AC> commands) {
        List<T> entities = getMapper().mapToEntity(commands);
        persistAll(entities);
        return entities;
    }

    @Transactional
    public T update(Long id, UC command) {
        T entity = findById(id);
        if (entity == null) return null;
        getMapper().updateEntity(entity, command);
        return entity;
    }

    @Transactional
    public void persist(T entity) {
        getDao().persist(entity);
    }

    @Transactional
    public void persistAll(List<T> entities) {
        entities.forEach(this::persist);
    }

    @Transactional
    public void deleteById(Long id) {
        getDao().deleteById(id);
    }
}
