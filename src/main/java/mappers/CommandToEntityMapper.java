package mappers;

import commands.AddCommand;
import commands.UpdateCommand;
import entities.BaseEntity;

import java.util.List;

public interface CommandToEntityMapper<T extends BaseEntity, AC extends AddCommand<T>, UC extends UpdateCommand<T>, D> {
    T mapToEntity(AC addCommand);
    void updateEntity(T entity, UC updateCommand);

    D mapToDto(T entity);

    default List<D> mapToDto(List<T> entities) {
        return entities.stream().map(this::mapToDto).toList();
    }
}
