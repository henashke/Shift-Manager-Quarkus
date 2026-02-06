package daos;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import entities.BaseEntity;

public interface BaseDao<T extends BaseEntity> extends PanacheRepositoryBase<T, Long> {
}
