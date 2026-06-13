package responders;

import commands.ConstraintCommand;
import commands.DeleteConstraintCommand;
import dto.ConstraintDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import mappers.ConstraintMapper;
import services.ConstraintService;

import java.util.List;

@ApplicationScoped
public class ConstraintResponder {

    @Inject
    ConstraintService constraintService;

    @Inject
    ConstraintMapper constraintMapper;

    public List<ConstraintDto> listAll() {
        return constraintMapper.mapToDto(constraintService.findAll());
    }

    public List<ConstraintDto> findByUserId(Long userId) {
        return constraintMapper.mapToDto(constraintService.findByUserId(userId));
    }

    public void create(ConstraintCommand command) throws Exception {
        constraintService.create(command);
    }

    public void delete(DeleteConstraintCommand command) {
        constraintService.delete(command);
    }
}
