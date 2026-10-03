import React from 'react';
import {observer} from 'mobx-react-lite';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import store from '../../stores/ShiftStore';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';

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

// A thin pill that fits on the caption line without making it much taller or wider
const todayButtonSx = {
    minWidth: 0,
    height: 20,
    px: 1,
    py: 0,
    borderRadius: 10,
    border: '1px solid',
    borderColor: 'primary.main',
    color: 'primary.light',
    fontSize: '0.7rem',
    fontWeight: 600,
    lineHeight: 1,
} as const;

const dateRangeSx = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 1,
    fontSize: {xs: '1rem', sm: '1.15rem'},
    lineHeight: 1.35,
} as const;

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
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1}}>
                <IconButton sx={navButtonSx} onClick={handlePrevWeekClick} aria-label="שבוע קודם">
                    <ChevronRight/>
                </IconButton>
                <Box display="flex" flexDirection="column" alignItems="center" sx={{minWidth: 0, textAlign: 'center'}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75}}>
                        <Typography variant="caption" color="primary.light" fontWeight={600}>
                            {weekOffsetLabel(store.weekOffset)}
                        </Typography>
                        {store.weekOffset !== 0 ? (
                            <Button onClick={handleTodayClick} aria-label="חזרה לשבוע הנוכחי" sx={todayButtonSx}>
                                היום
                            </Button>
                        ) : null}
                    </Box>
                    {/* Wraps onto two lines when narrow, so the dates never push the buttons out of the card */}
                    <Typography component="div" fontWeight={700} sx={dateRangeSx}>
                        <Box component="span" sx={{whiteSpace: 'nowrap'}}>{formatNavDate(weekDates[0])}</Box>
                        <Box component="span" sx={{whiteSpace: 'nowrap'}}>
                            <Typography component="span" variant="body2" color="text.secondary"
                                        sx={{marginInlineEnd: 1}}>עד</Typography>
                            {formatNavDate(weekDates[6])}
                        </Box>
                    </Typography>
                </Box>
                <IconButton sx={navButtonSx} onClick={handleNextWeekClick} aria-label="שבוע הבא">
                    <ChevronLeft/>
                </IconButton>
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
