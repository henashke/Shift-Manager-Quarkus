import React from 'react';
import IconButton from '@mui/material/IconButton';
import {createSvgIcon} from '@mui/material/utils';
import shiftStore, {kindOf} from '../../stores/ShiftStore';
import authStore from '../../stores/AuthStore';
import notificationStore from '../../stores/NotificationStore';
import {buildShiftsCalendar, calendarFileName, downloadCalendar} from '../../calendarExport';
import {dateKey} from '../../dateFormat';

// A calendar page with a plus (MUI's set has no such icon)
const CalendarPlusIcon = createSvgIcon(
    <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2"/>
        <path d="M8 3v4M16 3v4M3 10h18M12 13v6M9 16h6"/>
    </g>,
    'CalendarPlus',
);

// The usual icon button: a rounded square with a divider outline
const buttonSx = {
    width: 40,
    height: 40,
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
} as const;

const LABEL = 'הוספת המשמרות שלי בשבוע הזה ליומן';

// Downloads the signed-in user's saved regular shifts of the displayed week (every table) as an .ics file.
// Reads the store only when clicked, so it never re-renders with the week.
const AddToCalendarButton: React.FC = () => {
    const handleClick = () => {
        if (!shiftStore.hasShiftsForCurrentWeek) {
            notificationStore.showWarning('המשמרות של השבוע עוד נטענות, נסו שוב בעוד רגע');
            return;
        }
        const weekDates = shiftStore.weekDates;
        const days = new Set(weekDates.map(dateKey));
        const mine = shiftStore.assignedShifts
            .filter(s => s.assignedUsername === authStore.username && kindOf(s) === 'REGULAR'
                && days.has(dateKey(new Date(s.date))))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                || (a.type === 'יום' ? -1 : 1) - (b.type === 'יום' ? -1 : 1));
        if (mine.length === 0) {
            notificationStore.showWarning('אין לך משמרות בשבוע הזה');
            return;
        }
        downloadCalendar(buildShiftsCalendar(mine), calendarFileName(weekDates[0]));
    };

    return (
        <IconButton onClick={handleClick} sx={buttonSx} aria-label={LABEL} title={LABEL}>
            <CalendarPlusIcon/>
        </IconButton>
    );
};

export default AddToCalendarButton;
