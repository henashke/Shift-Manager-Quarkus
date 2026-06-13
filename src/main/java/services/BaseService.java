package services;

import daos.BaseDao;
import entities.BaseEntity;
import jakarta.transaction.Transactional;

import java.util.List;

public abstract class BaseService<T extends BaseEntity> {

    protected abstract BaseDao<T> getDao();

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
