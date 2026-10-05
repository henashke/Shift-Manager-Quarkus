// Date formatting for the UI. Each formatter is created once: toLocaleDateString builds a new formatter on every call,
// which was the biggest JavaScript cost of rendering the shift table (it runs per cell, row and header).
const dayMonth = new Intl.DateTimeFormat('he-IL', {day: 'numeric', month: 'numeric'});
const paddedDate = new Intl.DateTimeFormat('he-IL', {day: '2-digit', month: '2-digit', year: 'numeric'});
const weekdayDayMonth = new Intl.DateTimeFormat('he-IL', {weekday: 'long', day: 'numeric', month: 'numeric'});

// e.g. 27.9
export const formatDayMonth = (date: Date) => dayMonth.format(date);
// e.g. 27.09.2026
export const formatPaddedDate = (date: Date) => paddedDate.format(date);
// e.g. יום ראשון, 27.9
export const formatWeekdayDayMonth = (date: Date) => weekdayDayMonth.format(date);

// A cheap, stable key for a calendar day (React keys and lookups), with no locale formatting
export const dateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
