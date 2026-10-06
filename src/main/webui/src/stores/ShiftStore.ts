import {makeAutoObservable, reaction, runInAction} from "mobx";
import {authFetch, isUnchangedResponse, rememberResponse} from '../api';
import config from "../config";
import authStore from "./AuthStore";
import notificationStore from "./NotificationStore";
import {ShiftWeightPreset} from "./ShiftWeightStore";

export interface User {
    name: string;
    score: number;
    // Reservists (מילואים) are scheduled only when chosen
    reserve?: boolean;
    role?: string;
}

export type ShiftType = 'יום' | 'לילה';

export interface Shift {
    date: Date;
    type: ShiftType;
}

// The role an assignment fills in its shift. Shadow and jump are optional extras set by hand (never suggested); every
// shift has at most one of each, and nobody fills two roles of the same shift
export type ShiftKind = 'REGULAR' | 'SHADOW' | 'JUMP';

export const shiftKindLabels: Record<ShiftKind, string> = {
    REGULAR: 'כונן',
    SHADOW: 'כונן צל',
    JUMP: 'כונן הקפצה',
};

export interface AssignedShift extends Shift {
    assignedUsername: string;
    preset: ShiftWeightPreset;
    isPending?: boolean;
    // Missing means regular (older pending shifts in localStorage, and older servers)
    kind?: ShiftKind;
    // The week's extra table this shift belongs to; missing means the regular table
    specialTableName?: string;
}

export const kindOf = (shift: AssignedShift): ShiftKind => shift.kind ?? 'REGULAR';
// null is the regular table
export const tableOf = (shift: {specialTableName?: string | null}): string | null => shift.specialTableName ?? null;
export const REGULAR_TABLE_LABEL = 'רגיל';
export const MAX_TABLE_NAME_LENGTH = 50;

const PENDING_SHIFT_STORAGE_KEY = 'pendingAssignedShifts';
// Extra tables created on this device that may have no saved shift yet: {weekKey: names}
const LOCAL_TABLES_STORAGE_KEY = 'extraShiftTables';

const readLocalTables = (): Record<string, string[]> => {
    try {
        const parsed = JSON.parse(localStorage.getItem(LOCAL_TABLES_STORAGE_KEY) ?? '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

export class ShiftStore {
    assignedShifts: AssignedShift[] = [];
    pendingAssignedShifts: AssignedShift[] = [];
    weekOffset = 0;
    loading = false;
    // Shift fetches in flight; a counter so overlapping fetches (fast week clicks) don't end the indicator early
    pendingShiftFetches = 0;
    // The week offset the loaded shifts are centered on (null before the first load)
    loadedShiftsCenter: number | null = null;
    // Only the newest request may update the shifts, so a slow, older response can't overwrite a newer week
    private latestShiftRequest = 0;
    isSuggesting = false;
    // The extra table picked in the sub-tabs (null: the regular one); see activeTable
    selectedTable: string | null = null;
    localTables = readLocalTables();

    constructor() {
        makeAutoObservable(this);
        const savedPending = localStorage.getItem(PENDING_SHIFT_STORAGE_KEY);
        if (savedPending) {
            try {
                const parsed = JSON.parse(savedPending);
                this.pendingAssignedShifts = parsed.map((shift: any) => ({
                    ...shift,
                    date: new Date(shift.date)
                }));
            } catch {
            }
        }
        reaction(
            () => this.pendingAssignedShifts.slice(),
            (pending) => {
                localStorage.setItem(PENDING_SHIFT_STORAGE_KEY, JSON.stringify(pending));
            }
        );
    }

    get weekDates() {
        return weekDatesFor(this.weekOffset);
    }

    // Loads the weeks around weekOffset (the server's window), never the whole history
    fetchShifts = async (weekOffset: number = this.weekOffset) => {
        if (!authStore.isAuthenticated()) {
            return;
        }

        this.loading = true;
        this.pendingShiftFetches++;
        const requestId = ++this.latestShiftRequest;
        try {
            const response = await authFetch(`${config.API_BASE_URL}/shifts?weekOffset=${weekOffset}`, {
                method: 'GET',
                headers: authStore.getAuthHeaders(),
            });
            if (!response.ok) throw new Error('Failed to fetch shifts');
            const body = await response.text();
            runInAction(() => {
                this.loading = false;
                if (requestId !== this.latestShiftRequest) return;
                if (!isUnchangedResponse('shifts', body, this.assignedShifts)) {
                    this.assignedShifts = JSON.parse(body).map((shift: any) => ({
                        ...shift,
                        date: new Date(shift.date)
                    }));
                    rememberResponse('shifts', body, this.assignedShifts);
                }
                this.loadedShiftsCenter = weekOffset;
            });
        } catch (error) {
            runInAction(() => {
                this.loading = false;
                if (requestId !== this.latestShiftRequest) return;
                this.assignedShifts = [];
                this.loadedShiftsCenter = null;
            });
            console.error(error);
        } finally {
            runInAction(() => {
                this.pendingShiftFetches--;
            });
        }
    };

    get isFetchingShifts() {
        return this.pendingShiftFetches > 0;
    }

    // True when the displayed week is inside the loaded window, so it can show while a re-centering fetch runs
    get hasShiftsForCurrentWeek() {
        return isInWindow(this.weekOffset, this.loadedShiftsCenter);
    }
    unassignUser = async (shift: Shift, kind: ShiftKind = 'REGULAR', table: string | null = this.activeTable) => {
        const target = {date: shift.date, type: shift.type, kind, specialTableName: table ?? undefined};
        const pendingShiftToUnassign = this.pendingAssignedShifts.find(s => sameAssignment(s, target));
        if (pendingShiftToUnassign) {
            this.pendingAssignedShifts = this.pendingAssignedShifts.filter(s => !sameAssignment(s, target));
            return;
        }
        this.loading = true;
        try {
            const response = await authFetch(`${config.API_BASE_URL}/shifts`, {
                method: 'DELETE',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify(target),
            });
            if (!response.ok) throw new Error('Failed to unassign shift');
            runInAction(() => {
                this.assignedShifts = this.assignedShifts.filter(assignedShift => !sameAssignment(assignedShift, target));
                this.loading = false;
            });
        } catch (error) {
            runInAction(() => {
                this.loading = false;
            });
            console.error(error);
        }
    };

    // Computed lookups, so each table cell doesn't scan every shift; pending shifts take precedence
    get assignedShiftsByKey() {
        return new Map(this.assignedShifts.map(s => [assignmentKey(s, kindOf(s), tableOf(s)), s]));
    }

    get assignedOrPendingShiftsByKey() {
        const map = new Map(this.assignedShiftsByKey);
        this.pendingAssignedShifts.forEach(s => map.set(assignmentKey(s, kindOf(s), tableOf(s)), s));
        return map;
    }

    // shift can be undefined at runtime (e.g. a closed context menu), like sameShift tolerates
    // In the active table unless told otherwise
    getAssignedShift = (shift?: Shift, kind: ShiftKind = 'REGULAR', table: string | null = this.activeTable): AssignedShift | undefined => {
        return shift ? this.assignedShiftsByKey.get(assignmentKey(shift, kind, table)) : undefined;
    }

    getAssignedOrPendingShift = (shift?: Shift, kind: ShiftKind = 'REGULAR', table: string | null = this.activeTable): AssignedShift | undefined => {
        return shift ? this.assignedOrPendingShiftsByKey.get(assignmentKey(shift, kind, table)) : undefined;
    }

    // Another role someone already fills in this shift of the same table (saved or pending); other tables don't matter
    conflictingAssignment = (shift: Shift, username: string, kind: ShiftKind, table: string | null = this.activeTable) =>
        Array.from(this.assignedOrPendingShiftsByKey.values()).find(s =>
            s.assignedUsername === username && sameShift(s, shift) && tableOf(s) === table && kindOf(s) !== kind);

    // The displayed week's extra tables: from its shifts (saved or pending) and from this device's own new tables
    get tablesForCurrentWeek(): string[] {
        const week = weekKey(this.weekDates[0]);
        const names = new Set(this.localTables[week] ?? []);
        [...this.assignedShifts, ...this.pendingAssignedShifts].forEach(s => {
            const table = tableOf(s);
            if (table && weekKey(new Date(s.date)) === week) names.add(table);
        });
        return Array.from(names).sort((a, b) => a.localeCompare(b, 'he'));
    }

    // The table being shown and edited; back to the regular one on weeks without the selected table
    get activeTable(): string | null {
        return this.selectedTable && this.tablesForCurrentWeek.includes(this.selectedTable) ? this.selectedTable : null;
    }

    setSelectedTable = (table: string | null) => {
        this.selectedTable = table;
    }

    // Remembered on this device only, until its first shift is saved
    createTable = (name: string) => {
        const week = weekKey(this.weekDates[0]);
        const existing = this.localTables[week] ?? [];
        if (!existing.includes(name)) this.setLocalTables(week, [...existing, name]);
        this.selectedTable = name;
    }

    // Renames an extra table for the displayed week: its saved shifts on the server, its pending ones here
    renameTable = async (from: string, to: string): Promise<boolean> => {
        const week = weekKey(this.weekDates[0]);
        if (this.hasSavedShifts(week, from)) {
            const res = await authFetch(`${config.API_BASE_URL}/shifts/week/table`, {
                method: 'PUT',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify({weekStart: this.weekDates[0].toISOString().slice(0, 10), from, to})
            });
            if (!res.ok) return this.showTableError(res, 'שינוי שם הטבלה נכשל');
        }
        runInAction(() => {
            const rename = (s: AssignedShift) =>
                tableOf(s) === from && weekKey(new Date(s.date)) === week ? {...s, specialTableName: to} : s;
            this.assignedShifts = this.assignedShifts.map(rename);
            this.pendingAssignedShifts = this.pendingAssignedShifts.map(rename);
            this.setLocalTables(week, (this.localTables[week] ?? []).map(name => name === from ? to : name));
            this.selectedTable = to;
        });
        notificationStore.showSuccess('שם הטבלה שונה');
        return true;
    }

    // Deletes an extra table for the displayed week, with all its shifts (saved and pending)
    deleteTable = async (name: string): Promise<boolean> => {
        const week = weekKey(this.weekDates[0]);
        if (this.hasSavedShifts(week, name)) {
            const res = await authFetch(`${config.API_BASE_URL}/shifts/week`, {
                method: 'DELETE',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify({weekStart: this.weekDates[0].toISOString().slice(0, 10), specialTableName: name})
            });
            if (!res.ok) return this.showTableError(res, 'מחיקת הטבלה נכשלה');
        }
        runInAction(() => {
            const other = (s: AssignedShift) => !(tableOf(s) === name && weekKey(new Date(s.date)) === week);
            this.assignedShifts = this.assignedShifts.filter(other);
            this.pendingAssignedShifts = this.pendingAssignedShifts.filter(other);
            this.setLocalTables(week, (this.localTables[week] ?? []).filter(table => table !== name));
            this.selectedTable = null;
        });
        notificationStore.showSuccess('הטבלה נמחקה');
        return true;
    }

    private hasSavedShifts = (week: string, table: string) =>
        this.assignedShifts.some(s => tableOf(s) === table && weekKey(new Date(s.date)) === week);

    private setLocalTables = (week: string, names: string[]) => {
        const {[week]: _, ...others} = this.localTables;
        this.localTables = names.length > 0 ? {...others, [week]: names} : others;
        try {
            localStorage.setItem(LOCAL_TABLES_STORAGE_KEY, JSON.stringify(this.localTables));
        } catch {
        }
    }

    private showTableError = async (res: Response, fallback: string) => {
        const body = await res.json().catch(() => null);
        notificationStore.showError(body?.error ?? fallback);
        return false;
    }

    // Tabs fetch their own data for the new week (see their weekOffset effects)
    setWeekOffset = (offset: number) => {
        this.weekOffset = offset;
    }

    assignShiftPending = (shift: AssignedShift) => {
        this.pendingAssignedShifts = this.pendingAssignedShifts.filter(s => !sameAssignment(s, shift));
        this.pendingAssignedShifts.push({...shift, isPending: true});
    };

    mergePendingToAssigned = () => {
        this.pendingAssignedShifts.forEach(pending => {
            this.assignedShifts = this.assignedShifts.filter(s => !sameAssignment(s, pending));
            this.assignedShifts.push({...pending, isPending: false});
        });
        this.pendingAssignedShifts = [];
        this.loading = false;
    };

    savePendingAssignments = async () => {
        this.loading = true;
        try {
            const response = await authFetch(`${config.API_BASE_URL}/shifts`, {
                method: 'POST',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify(this.pendingAssignedShifts),
            });
            if (!response.ok) {
                if (response.status === 403) {
                    notificationStore.showUnauthorizedError();
                } else {
                    // Try to show backend error message if available
                    let errorMsg = 'Failed to save shifts';
                    try {
                        const data = await response.json();
                        if (data && data.error) errorMsg = data.error;
                    } catch {
                    }
                    notificationStore.showError(errorMsg);
                }
                return;
            }
            const count = this.pendingAssignedShifts.length;
            runInAction(() => {
                this.mergePendingToAssigned();
            });
            notificationStore.showSuccess(count === 1 ? 'השיבוץ נשמר' : `${count} שיבוצים נשמרו`);
        } catch (error) {
            runInAction(() => {
                this.loading = false;
            });
            notificationStore.showError('Failed to save shifts');
            console.error(error);
        }
    };

    // Fills the regular role of the active table
    async suggestShiftAssignments(userIds: string[], startDate: Date, endDate: Date) {
        const table = this.activeTable;
        this.loading = true;
        this.isSuggesting = true;
        try {
            const response = await authFetch(`${config.API_BASE_URL}/shifts/suggest`, {
                method: 'POST',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify({userIds, startDate, endDate, specialTableName: table}),
            });
            if (!response.ok) {
                if (response.status === 403) {
                    notificationStore.showUnauthorizedError();
                } else {
                    throw new Error('Failed to suggest shifts');
                }
                return;
            }
            const data = await response.json();
            runInAction(() => {
                // Suggestions only fill this table's regular role, so other pending assignments stay
                const pendingOthers = this.pendingAssignedShifts.filter(s => kindOf(s) !== 'REGULAR' || tableOf(s) !== table);
                this.pendingAssignedShifts = [...pendingOthers, ...data.map((shift: any) => {
                    return ({
                        date: new Date(shift.date),
                        type: shift.type,
                        assignedUsername: shift.assignedUsername || '',
                        preset: shift.preset,
                        kind: 'REGULAR' as ShiftKind,
                        specialTableName: table ?? undefined,
                        isPending: true
                    })
                })];
                this.loading = false;
            });
        } catch (error) {
            runInAction(() => {
                this.loading = false;
            });
            notificationStore.showError('הצעת השיבוץ נכשלה');
            console.error(error);
        } finally {
            runInAction(() => {
                this.isSuggesting = false;
            });
        }
    }

    // Clears the active table's shifts for the displayed week
    resetWeeklyShifts = async (): Promise<'success' | 'error'> => {
        const table = this.activeTable;
        this.loading = true;
        try {
            const weekStart = this.weekDates[0];
            const response = await authFetch(`${config.API_BASE_URL}/shifts/week`, {
                method: 'DELETE',
                headers: authStore.getAuthHeaders(),
                body: JSON.stringify({weekStart: weekStart.toISOString().slice(0, 10), specialTableName: table})
            });
            if (!response.ok) {
                if (response.status === 403) {
                    notificationStore.showUnauthorizedError();
                } else {
                    throw new Error('Failed to reset weekly shifts');
                }
                return 'error';
            }
            await this.fetchShifts();
            runInAction(() => {
                this.loading = false;
            });
            return 'success';
        } catch (error) {
            runInAction(() => {
                this.loading = false;
            });
            console.error(error);
            return 'error';
        }
    }

    recalculateScores = async (): Promise<'success' | 'error'> => {
        this.loading = true;
        try {
            const response = await authFetch(`${config.API_BASE_URL}/shifts/recalculateAllUsersScores`, {
                method: 'POST',
                headers: authStore.getAuthHeaders(),
            });
            if (!response.ok) {
                if (response.status === 403) {
                    notificationStore.showUnauthorizedError();
                } else {
                    throw new Error('Failed to recalculate scores');
                }
                return 'error';
            }
            runInAction(() => {
                this.loading = false;
            });
            return 'success';
        } catch (error) {
            runInAction(() => {
                this.loading = false;
            });
            console.error(error);
            return 'error';
        }
    }
}

const store = new ShiftStore();
// The server returns the requested week plus 2 weeks on each side (WeekWindow.java). A week counts as loaded only
// within 1 of the center: the server works out "this week" in its own time zone, which can be a week off from ours
// around Saturday midnight.
const LOADED_WEEKS_RADIUS = 1;

// Sunday to Saturday of the week weekOffset weeks from this one
export const weekDatesFor = (weekOffset: number) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    start.setHours(10);
    return Array.from({length: 7}, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });
};

export const isInWindow = (weekOffset: number, loadedCenter: number | null) =>
    loadedCenter !== null && Math.abs(weekOffset - loadedCenter) <= LOADED_WEEKS_RADIUS;

// Same day (local time) and type, matching sameShift
export const shiftKey = (shift: Shift) => {
    const date = new Date(shift.date);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}|${shift.type}`;
};

const assignmentKey = (shift: Shift, kind: ShiftKind, table: string | null) => `${shiftKey(shift)}|${kind}|${table ?? ''}`;

// The local date of the Sunday starting the date's week, so tables are remembered per week
const weekKey = (date: Date) => {
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - date.getDay());
    return `${sunday.getFullYear()}-${sunday.getMonth() + 1}-${sunday.getDate()}`;
};

type Assignment = Shift & {kind?: ShiftKind, specialTableName?: string};

// Same shift, role and table
export const sameAssignment = (a: Assignment, b: Assignment) =>
    sameShift(a, b) && (a.kind ?? 'REGULAR') === (b.kind ?? 'REGULAR') && tableOf(a) === tableOf(b);

export const sameShift = (shift1: Shift, shift2: Shift) => {
    if (!shift1 || !shift2) return false;
    const date1 = new Date(shift1.date);
    const date2 = new Date(shift2.date);
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate() &&
        shift1.type === shift2.type
    );
}
export default store;