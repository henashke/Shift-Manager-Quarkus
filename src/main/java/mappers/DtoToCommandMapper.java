package mappers;

import commands.AddCommand;
import commands.UpdateCommand;
import entities.BaseEntity;

import java.util.List;

public interface DtoToCommandMapper<D, T extends BaseEntity, AC extends AddCommand<T>, UC extends UpdateCommand<T>> {
    AC mapToAddCommand(D dto);

    UC mapToUpdateCommand(D dto);

    D mapToDto(T entity);

    default List<D> mapToDto(List<T> entities) {
        return entities.stream().map(this::mapToDto).toList();
    }
}
