import {makeAutoObservable, runInAction} from 'mobx';
import {authFetch} from '../api';
import config from '../config';
import authStore from './AuthStore';

// Counts are regular shifts (every table) up to today; shadow and jump are counted on their own
export interface UserStats {
    name: string;
    reserve: boolean;
    firstShiftDate: string | null;
    daysSinceFirstShift: number;
    // Since January 1st
    shiftsThisYear: number;
    shiftsAllTime: number;
    shiftsLast30Days: number;
    dayShifts: number;
    nightShifts: number;
    weekendShifts: number;
    shadowShifts: number;
    jumpShifts: number;
}

export interface Stats {
    users: UserStats[];
}

// The share panel: everyone (reservists too), with their share of the team's last 30 days
export interface StatsView {
    users: (UserStats & {shareLast30Days: number})[];
    shiftsLast30Days: number;
    shiftsThisYear: number;
    shiftsAllTime: number;
}

// How the people cards are ordered; numbers sort high to low
export type StatsSort = 'name' | 'allTime' | 'last30Days' | 'thisYear' | 'day' | 'night' | 'weekend';

export const statsSortLabels: Record<StatsSort, string> = {
    name: 'שם',
    allTime: 'סך הכול',
    last30Days: '30 הימים האחרונים',
    thisYear: 'השנה',
    day: 'משמרות יום',
    night: 'משמרות לילה',
    weekend: 'סופ"ש',
};

const sortValue: Record<Exclude<StatsSort, 'name'>, (user: UserStats) => number> = {
    allTime: user => user.shiftsAllTime,
    last30Days: user => user.shiftsLast30Days,
    thisYear: user => user.shiftsThisYear,
    day: user => user.dayShifts,
    night: user => user.nightShifts,
    weekend: user => user.weekendShifts,
};

// Remembered per device; a convenience, so failures are ignored
const SORT_STORAGE_KEY = 'statsSort';
const INCLUDE_RESERVES_STORAGE_KEY = 'statsIncludeReserves';
const remember = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch {
    }
};
const readIncludeReserves = () => {
    try {
        return localStorage.getItem(INCLUDE_RESERVES_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};
const readSort = (): StatsSort => {
    try {
        const saved = localStorage.getItem(SORT_STORAGE_KEY);
        return saved && saved in statsSortLabels ? saved as StatsSort : 'name';
    } catch {
        return 'name';
    }
};

class StatsStore {
    stats: Stats | null = null;
    loading = false;
    failed = false;
    sort: StatsSort = readSort();
    includeReserves = readIncludeReserves();

    constructor() {
        makeAutoObservable(this);
    }

    setSort = (sort: StatsSort) => {
        this.sort = sort;
        remember(SORT_STORAGE_KEY, sort);
    };

    setIncludeReserves = (include: boolean) => {
        this.includeReserves = include;
        remember(INCLUDE_RESERVES_STORAGE_KEY, String(include));
    };

    get hasReserves() {
        return !!this.stats?.users.some(user => user.reserve);
    }

    get view(): StatsView | null {
        if (!this.stats) return null;
        const users = this.stats.users;
        const sum = (pick: (user: UserStats) => number) => users.reduce((total, user) => total + pick(user), 0);
        const last30Days = sum(user => user.shiftsLast30Days);
        return {
            users: users.map(user => ({
                ...user,
                shareLast30Days: last30Days ? user.shiftsLast30Days / last30Days * 100 : 0
            })),
            shiftsLast30Days: last30Days,
            shiftsThisYear: sum(user => user.shiftsThisYear),
            shiftsAllTime: sum(user => user.shiftsAllTime),
        };
    }

    // The people list: reservists only when included
    get listedUsers(): UserStats[] {
        return (this.stats?.users ?? []).filter(user => this.includeReserves || !user.reserve);
    }

    // Highest first, ties by name; by name, the viewer's own card comes first
    sorted = (users: UserStats[], me: string | null): UserStats[] => {
        const byName = (a: UserStats, b: UserStats) => a.name.localeCompare(b.name, 'he', {sensitivity: 'base'});
        const sort = this.sort;
        if (sort === 'name') {
            return [...users].sort((a, b) => Number(b.name === me) - Number(a.name === me) || byName(a, b));
        }
        const value = sortValue[sort];
        return [...users].sort((a, b) => value(b) - value(a) || byName(a, b));
    };

    fetchStats = async () => {
        this.loading = true;
        this.failed = false;
        try {
            const res = await authFetch(`${config.API_BASE_URL}/stats`, {headers: authStore.getAuthHeaders()});
            if (!res.ok) throw new Error('Failed to fetch stats');
            const stats: Stats = await res.json();
            runInAction(() => this.stats = stats);
        } catch (e) {
            runInAction(() => this.failed = true);
        } finally {
            runInAction(() => this.loading = false);
        }
    };
}

const statsStore = new StatsStore();
export default statsStore;
