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

const CalendarNavigation: React.FC<CalendarNavigationProps> = observer(({actions}) => {
    const weekDates = store.weekDates;
    const handlePrevWeekClick = () => store.setWeekOffset(store.weekOffset - 1);
    const handleNextWeekClick = () => store.setWeekOffset(store.weekOffset + 1);
    const handleTodayClick = () => store.setWeekOffset(0);

    return (
        <Paper sx={{borderRadius: 3, boxShadow: 3, p: 2, mb: 2}}>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                <IconButton sx={navButtonSx} onClick={handlePrevWeekClick}><ChevronRight/></IconButton>
                <Box display="flex" flexDirection="column" alignItems="center">
                    {store.weekOffset === 0
                        ? <Typography variant="caption" color="primary.light" fontWeight={600}>השבוע הנוכחי</Typography>
                        : <Button size="small" onClick={handleTodayClick}
                                  sx={{p: 0, minWidth: 0, fontSize: '0.75rem', lineHeight: 1.66, fontWeight: 600}}>
                            חזרה להיום
                        </Button>}
                    <Typography variant="h6" fontWeight={700} sx={{lineHeight: 1.3}}>
                        {formatNavDate(weekDates[0])}
                        <Typography component="span" variant="body2" color="text.secondary" sx={{mx: 1}}>עד</Typography>
                        {formatNavDate(weekDates[6])}
                    </Typography>
                </Box>
                <IconButton sx={navButtonSx} onClick={handleNextWeekClick}><ChevronLeft/></IconButton>
            </Box>
            {actions ? <Box display="flex" justifyContent="center" gap={1.5} mt={2}>{actions}</Box> : null}
        </Paper>
    );
});

const formatNavDate = (date: Date) =>
    date.toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit', year: 'numeric'});

export const formatDate = (date: Date) =>
    date.toLocaleDateString('he-IL', {month: 'numeric', day: 'numeric', year: 'numeric'});

export default CalendarNavigation;
