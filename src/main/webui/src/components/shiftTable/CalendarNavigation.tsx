import React from 'react';
import {observer} from 'mobx-react-lite';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import store from '../../stores/ShiftStore';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Today from '@mui/icons-material/Today';

interface CalendarNavigationProps {
    actions?: React.ReactNode;
}

const navButtonSx = {
    width: 40,
    height: 40,
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    flexShrink: 0,
};

// Equal-width sides keep the date range centered when one side has more buttons
const navSideSx = {flex: 1, display: 'flex', gap: 1};

const weekOffsetLabel = (offset: number) => {
    const weeks = Math.abs(offset);
    const amount = weeks === 1 ? 'שבוע' : weeks === 2 ? 'שבועיים' : `${weeks} שבועות`;
    if (offset === 0) return 'השבוע הנוכחי';
    return offset < 0 ? `לפני ${amount}` : `עוד ${amount}`;
};

const CalendarNavigation: React.FC<CalendarNavigationProps> = observer(({actions}) => {
    const weekDates = store.weekDates;
    const handlePrevWeekClick = () => store.setWeekOffset(store.weekOffset - 1);
    const handleNextWeekClick = () => store.setWeekOffset(store.weekOffset + 1);
    const handleTodayClick = () => store.setWeekOffset(0);

    return (
        <Paper sx={{borderRadius: 3, boxShadow: 3, p: 2, mb: 2, maxWidth: 600, mx: 'auto'}}>
            <Box display="flex" alignItems="center" gap={1}>
                <Box sx={navSideSx}>
                    <IconButton sx={navButtonSx} onClick={handlePrevWeekClick} aria-label="שבוע קודם">
                        <ChevronRight/>
                    </IconButton>
                </Box>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <Typography variant="caption" color="primary.light" fontWeight={600}>
                        {weekOffsetLabel(store.weekOffset)}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{lineHeight: 1.3}}>
                        {formatNavDate(weekDates[0])}
                        <Typography component="span" variant="body2" color="text.secondary" sx={{mx: 1}}>עד</Typography>
                        {formatNavDate(weekDates[6])}
                    </Typography>
                </Box>
                <Box sx={{...navSideSx, justifyContent: 'flex-end'}}>
                    <IconButton sx={navButtonSx} onClick={handleNextWeekClick} aria-label="שבוע הבא">
                        <ChevronLeft/>
                    </IconButton>
                    <Tooltip title="חזרה לשבוע הנוכחי" arrow>
                        <span>
                            <IconButton sx={navButtonSx} onClick={handleTodayClick} disabled={store.weekOffset === 0}
                                        aria-label="חזרה לשבוע הנוכחי">
                                <Today/>
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </Box>
            {actions ? <Box display="flex" gap={1.5} mt={2}>{actions}</Box> : null}
        </Paper>
    );
});

const formatNavDate = (date: Date) =>
    date.toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit', year: 'numeric'});

export const formatDate = (date: Date) =>
    date.toLocaleDateString('he-IL', {month: 'numeric', day: 'numeric', year: 'numeric'});

export default CalendarNavigation;
