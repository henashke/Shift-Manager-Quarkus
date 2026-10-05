package responders;

import dto.StatsDto;
import dto.UserStatsDto;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.RequiredArgsConstructor;
import services.StatsService;
import services.StatsService.UserStats;

@ApplicationScoped
@RequiredArgsConstructor
public class StatsResponder {

    private final StatsService service;

    public StatsDto stats() {
        StatsDto dto = new StatsDto();
        dto.users = service.userStats().stream().map(StatsResponder::toDto).toList();
        return dto;
    }

    private static UserStatsDto toDto(UserStats stats) {
        UserStatsDto dto = new UserStatsDto();
        dto.name = stats.user().name;
        dto.reserve = stats.user().reserve;
        dto.firstShiftDate = stats.firstShift();
        dto.daysSinceFirstShift = stats.daysSinceFirstShift();
        dto.shiftsThisYear = stats.thisYear();
        dto.shiftsAllTime = stats.allTime();
        dto.shiftsLast30Days = stats.recent();
        dto.dayShifts = stats.day();
        dto.nightShifts = stats.night();
        dto.weekendShifts = stats.weekend();
        dto.shadowShifts = stats.shadow();
        dto.jumpShifts = stats.jump();
        return dto;
    }
}
