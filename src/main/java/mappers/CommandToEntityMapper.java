package mappers;

import commands.AddCommand;
import commands.UpdateCommand;
import entities.BaseEntity;

public interface CommandToEntityMapper<T extends BaseEntity, AC extends AddCommand<T>, UC extends UpdateCommand<T>> {
    T mapToEntity(AC addCommand);
    void updateEntity(T entity, UC updateCommand);
}
