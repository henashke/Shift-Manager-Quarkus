package services;

import commands.AddCommand;
import daos.BaseDao;
import entities.BaseEntity;
import jakarta.transaction.Transactional;
import mappers.CommandToEntityMapper;

import java.util.List;

public abstract class BaseService<T extends BaseEntity, AC extends AddCommand<T>> {

    protected abstract BaseDao<T> getDao();

    protected abstract CommandToEntityMapper<T, AC, ?, ?> getMapper();

    public T findById(Long id) {
        return getDao().findById(id);
    }

    public List<T> listAll() {
        return getDao().listAll();
    }

    @Transactional
    public void persist(T entity) {
        getDao().persist(entity);
    }

    @Transactional
    public void deleteById(Long id) {
        getDao().deleteById(id);
    }
}
