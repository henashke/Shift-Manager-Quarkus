// Turns a user's shifts into an iCalendar (.ics) file that Google Calendar, Apple Calendar and Outlook import.
// Built in the browser from the shifts already loaded, so nothing new is asked of the server or a third party.
import {AssignedShift, kindOf, shiftKindLabels, tableOf} from './stores/ShiftStore';

const TIME_ZONE = 'Asia/Jerusalem';
// Day shifts run 08:00-20:00, night shifts 20:00 until 08:00 the next morning
const DAY_START = '080000';
const NIGHT_START = '200000';

// Israel's rules since 2013: summer time from the Friday before the last Sunday of March to the last Sunday of October,
// both at 02:00. Calendar apps need the zone spelled out to place TZID times reliably.
const VTIMEZONE = [
    'BEGIN:VTIMEZONE',
    `TZID:${TIME_ZONE}`,
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0300',
    'TZNAME:IDT',
    'DTSTART:19700327T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=23,24,25,26,27,28,29;BYDAY=FR',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0300',
    'TZOFFSETTO:+0200',
    'TZNAME:IST',
    'DTSTART:19701025T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
];

const pad = (n: number) => String(n).padStart(2, '0');
// The shift's calendar day as YYYYMMDD, read in local time like the table does (sameShift)
const icsDate = (date: Date) => `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
const nextDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 12);
const utcStamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// TEXT values escape backslashes, semicolons, commas and newlines (RFC 5545 3.3.11)
const escapeText = (text: string) => text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

// Lines longer than 75 octets are folded, continuing with a space. Hebrew takes two octets a letter in UTF-8, so this
// counts bytes, and never splits a character.
const utf8Length = (char: string) => {
    const code = char.codePointAt(0) ?? 0;
    return code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
};
const foldLine = (line: string): string => {
    const parts: string[] = [];
    let current = '';
    let currentBytes = 0;
    for (const char of line) {
        const bytes = utf8Length(char);
        const limit = parts.length === 0 ? 75 : 74;
        if (currentBytes + bytes > limit) {
            parts.push(current);
            current = '';
            currentBytes = 0;
        }
        current += char;
        currentBytes += bytes;
    }
    parts.push(current);
    return parts.join('\r\n ');
};

export const shiftEventTitle = (shift: AssignedShift) => {
    const kind = kindOf(shift);
    const role = kind === 'REGULAR' ? '' : ` (${shiftKindLabels[kind]})`;
    const table = tableOf(shift);
    return `משמרת ${shift.type}${role}${table ? ` - ${table}` : ''}`;
};

const shiftEvent = (shift: AssignedShift, stamp: string): string[] => {
    const date = new Date(shift.date);
    const day = icsDate(date);
    const isNight = shift.type === 'לילה';
    const start = `${day}T${isNight ? NIGHT_START : DAY_START}`;
    const end = isNight ? `${icsDate(nextDay(date))}T${DAY_START}` : `${day}T${NIGHT_START}`;
    // Stable per assignment, so importing the same week again updates the events instead of duplicating them
    const uid = [day, isNight ? 'night' : 'day', kindOf(shift), tableOf(shift) ?? '', shift.assignedUsername]
        .map(encodeURIComponent).join('-');
    return [
        'BEGIN:VEVENT',
        `UID:${uid}@shift-manager`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=${TIME_ZONE}:${start}`,
        `DTEND;TZID=${TIME_ZONE}:${end}`,
        `SUMMARY:${escapeText(shiftEventTitle(shift))}`,
        'TRANSP:OPAQUE',
        'END:VEVENT',
    ];
};

export const buildShiftsCalendar = (shifts: AssignedShift[], now: Date = new Date()): string => {
    const stamp = utcStamp(now);
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Shift Manager//Shifts//HE',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:משמרות',
        `X-WR-TIMEZONE:${TIME_ZONE}`,
        ...VTIMEZONE,
        ...shifts.flatMap(shift => shiftEvent(shift, stamp)),
        'END:VCALENDAR',
    ];
    return lines.map(foldLine).join('\r\n') + '\r\n';
};

// e.g. shifts-2026-11-15.ics for the week starting that Sunday
export const calendarFileName = (weekStart: Date) =>
    `shifts-${weekStart.getFullYear()}-${pad(weekStart.getMonth() + 1)}-${pad(weekStart.getDate())}.ics`;

// Saves the file through the browser; phones hand .ics files to their calendar app
export const downloadCalendar = (content: string, fileName: string) => {
    const url = URL.createObjectURL(new Blob([content], {type: 'text/calendar;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Some browsers read the blob after click() returns
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
