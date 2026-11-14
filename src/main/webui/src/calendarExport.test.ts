import {buildShiftsCalendar, calendarFileName} from './calendarExport';
import {AssignedShift} from './stores/ShiftStore';

const shift = (date: Date, type: 'יום' | 'לילה', specialTableName?: string): AssignedShift =>
    ({date, type, assignedUsername: 'dana', preset: {name: '', weights: []}, specialTableName});

describe('buildShiftsCalendar', () => {
    const ics = buildShiftsCalendar([
        shift(new Date(2026, 10, 17, 10), 'יום'),
        shift(new Date(2026, 10, 21, 10), 'לילה', 'טבלה, מיוחדת'),
        shift(new Date(2026, 11, 31, 10), 'לילה'),
    ], new Date(Date.UTC(2026, 10, 15, 9, 30)));
    const lines = ics.split('\r\n');

    it('is a CRLF calendar with the Jerusalem zone', () => {
        expect(lines[0]).toBe('BEGIN:VCALENDAR');
        expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
        expect(lines).toContain('TZID:Asia/Jerusalem');
        expect(lines).toContain('DTSTAMP:20261115T093000Z');
    });

    it('runs day shifts 08:00-20:00 and night shifts past midnight', () => {
        expect(lines).toContain('DTSTART;TZID=Asia/Jerusalem:20261117T080000');
        expect(lines).toContain('DTEND;TZID=Asia/Jerusalem:20261117T200000');
        expect(lines).toContain('DTSTART;TZID=Asia/Jerusalem:20261121T200000');
        expect(lines).toContain('DTEND;TZID=Asia/Jerusalem:20261122T080000');
        expect(lines).toContain('DTEND;TZID=Asia/Jerusalem:20270101T080000');
    });

    it('names the extra table, escaped', () => {
        expect(ics).toContain('SUMMARY:משמרת לילה - טבלה\\, מיוחדת');
    });

    it('folds lines at 75 octets without splitting letters', () => {
        const long = buildShiftsCalendar([shift(new Date(2026, 10, 17, 10), 'יום', 'א'.repeat(50))]);
        const physical = long.split('\r\n');
        physical.forEach(line => expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75));
        expect(long.replace(/\r\n /g, '')).toContain(`SUMMARY:משמרת יום - ${'א'.repeat(50)}`);
    });

    it('names the file after the week', () => {
        expect(calendarFileName(new Date(2026, 10, 15))).toBe('shifts-2026-11-15.ics');
    });
});
