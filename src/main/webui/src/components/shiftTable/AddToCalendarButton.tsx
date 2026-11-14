import React from 'react';
import {observer} from 'mobx-react-lite';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import EventOutlined from '@mui/icons-material/EventOutlined';
import shiftStore, {kindOf} from '../../stores/ShiftStore';
import authStore from '../../stores/AuthStore';
import notificationStore from '../../stores/NotificationStore';
import {buildShiftsCalendar, calendarFileName, downloadCalendar} from '../../calendarExport';
import {dateKey} from '../../dateFormat';

// A thin outlined pill that fits on the navigation's caption line next to "חזור להיום", without making it taller
const buttonSx = {
    minWidth: 0,
    height: 20,
    px: 1,
    py: 0,
    gap: 0.5,
    borderRadius: 10,
    fontSize: '0.7rem',
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    '& .MuiButton-startIcon': {m: 0},
    '& .MuiButton-startIcon > svg': {fontSize: 14},
} as const;

// On phones, weeks other than this one also show "חזור להיום" on the caption line, so the pill drops its text there
const labelSx = {display: 'inline'} as const;
const labelHiddenOnPhonesSx = {display: {xs: 'none', sm: 'inline'}} as const;

// Downloads the signed-in user's saved regular shifts of the displayed week (every table) as an .ics file.
// Reads the shifts only when clicked; only the button itself re-renders when the week changes.
const AddToCalendarButton: React.FC = observer(() => {
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
        <Button variant="outlined" color="inherit" onClick={handleClick} startIcon={<EventOutlined/>} sx={buttonSx}
                aria-label="הוספת המשמרות שלי בשבוע הזה ליומן" title="הוספת המשמרות שלי בשבוע הזה ליומן">
            <Box component="span" sx={shiftStore.weekOffset !== 0 ? labelHiddenOnPhonesSx : labelSx}>הוסף ליומן</Box>
        </Button>
    );
});

export default AddToCalendarButton;
