package dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

// The stats page: each schedulable user's numbers (regular shifts up to today). The page adds up the team totals and
// shares itself, over whoever it shows (with or without reservists).
@RegisterForReflection
public class StatsDto {
    public List<UserStatsDto> users;
}
