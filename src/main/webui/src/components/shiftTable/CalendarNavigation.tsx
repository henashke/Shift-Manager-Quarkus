import React, {useEffect, useRef} from 'react';
import {observer} from 'mobx-react-lite';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import {alpha, SxProps, Theme} from '@mui/material/styles';
import store from '../../stores/ShiftStore';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import {useCompactOnScroll} from './useCompactOnScroll';

interface CalendarNavigationProps {
    actions?: React.ReactNode;
}

// Sticks just below the top bar (56px tall, 1px border) with a small gap
const STICKY_TOP_PX = 64;
const EASING = 'cubic-bezier(0.2, 0.9, 0.3, 1)';

// A thin filled pill (the theme's primary gradient) that fits on the caption line without making it taller
const todayButtonSx = {
    minWidth: 0,
    height: 20,
    px: 1,
    py: 0,
    borderRadius: 10,
    fontSize: '0.7rem',
    fontWeight: 600,
    lineHeight: 1,
} as const;

const compactTodayButtonSx = {...todayButtonSx, whiteSpace: 'nowrap'} as const;

const weekOffsetLabel = (offset: number) => {
    const weeks = Math.abs(offset);
    const amount = weeks === 1 ? 'שבוע' : weeks === 2 ? 'שבועיים' : `${weeks} שבועות`;
    if (offset === 0) return 'השבוע הנוכחי';
    return offset < 0 ? `לפני ${amount}` : `עוד ${amount}`;
};

// Folds a section to zero height by animating its grid row (real height, not just a fade)
const Collapsible: React.FC<{ open: boolean, transition: string, children: React.ReactNode }> = ({open, transition, children}) => (
    <Box sx={{display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0, transition}}>
        <Box sx={{overflow: 'hidden', minHeight: 0}}>{children}</Box>
    </Box>
);

/**
 * Sticks below the top bar. Scrolling down shrinks it into a compact, frosted pill (like Safari's toolbar on iPhone);
 * scrolling up, reaching the top or tapping it brings it back.
 */
const CalendarNavigation: React.FC<CalendarNavigationProps> = observer(({actions}) => {
    const weekDates = store.weekDates;
    const handlePrevWeekClick = () => store.setWeekOffset(store.weekOffset - 1);
    const handleNextWeekClick = () => store.setWeekOffset(store.weekOffset + 1);
    const handleTodayClick = () => store.setWeekOffset(0);

    const [compact, setCompact] = useCompactOnScroll();
    const showCompactToday = compact && store.weekOffset !== 0;
    const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', {noSsr: true});
    const duration = reduceMotion ? 0 : 320;
    const transition = (...properties: string[]) => properties.map(p => `${p} ${duration}ms ${EASING}`).join(', ');

    // The wrapper keeps the full-size height while compact, so the page below never jumps (and on short pages the
    // scroll position can't snap back and flip the state again)
    const wrapperRef = useRef<HTMLDivElement>(null);
    const paperRef = useRef<HTMLDivElement>(null);
    // Only a fully expanded, settled card is measured: a height caught mid-animation would resize the reserved space,
    // and the browser's scroll anchoring would then move the page and flip the state back
    const settled = useRef(true);
    const measureExpanded = () => {
        if (settled.current && paperRef.current && wrapperRef.current) {
            wrapperRef.current.style.minHeight = `${paperRef.current.offsetHeight}px`;
        }
    };
    useEffect(() => {
        settled.current = false;
        if (compact) return;
        const timer = setTimeout(() => {
            settled.current = true;
            measureExpanded();
        }, duration + 50);
        return () => clearTimeout(timer);
    }, [compact, duration]);
    useEffect(() => {
        const paper = paperRef.current;
        if (!paper) return;
        // Keeps the reserved space right when the full-size card changes, e.g. the admin buttons or a window resize
        const observer = new ResizeObserver(measureExpanded);
        observer.observe(paper);
        return () => observer.disconnect();
    }, []);

    const expandOnTap = (e: React.MouseEvent) => {
        if (compact && !(e.target as HTMLElement).closest('button')) setCompact(false);
    };

    const navButtonSx: SxProps<Theme> = {
        width: compact ? 32 : 40,
        height: compact ? 32 : 40,
        borderRadius: compact ? '50%' : 2,
        border: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
        transition: transition('width', 'height', 'border-radius'),
    };

    return (
        <Box ref={wrapperRef} sx={{
            position: 'sticky',
            top: STICKY_TOP_PX,
            zIndex: theme => theme.zIndex.appBar - 3,
            mb: 2,
            // Only the card takes clicks; the rest of the reserved space lets the table underneath be used
            pointerEvents: 'none',
        }}>
            <Paper ref={paperRef} onClick={expandOnTap} sx={{
                pointerEvents: 'auto',
                mx: 'auto',
                maxWidth: compact ? 360 : 600,
                p: compact ? 0.75 : 2,
                borderRadius: compact ? '28px' : 3,
                boxShadow: compact ? '0 10px 28px rgba(0, 0, 0, 0.35)' : 3,
                // Compact, it floats over the table like a frosted pill
                bgcolor: theme => compact ? alpha(theme.palette.background.paper, 0.78) : theme.palette.background.paper,
                backdropFilter: compact ? 'blur(14px) saturate(1.4)' : 'none',
                cursor: compact ? 'pointer' : 'default',
                transition: transition('max-width', 'padding', 'border-radius', 'box-shadow', 'background-color'),
            }}>
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1}}>
                    <IconButton sx={navButtonSx} onClick={handlePrevWeekClick} aria-label="שבוע קודם">
                        <ChevronRight fontSize={compact ? 'small' : 'medium'}/>
                    </IconButton>
                    <Box display="flex" flexDirection="column" alignItems="center" sx={{minWidth: 0, textAlign: 'center'}}>
                        <Collapsible open={!compact} transition={transition('grid-template-rows', 'opacity')}>
                            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75}}>
                                <Typography variant="caption" color="primary.light" fontWeight={600}>
                                    {weekOffsetLabel(store.weekOffset)}
                                </Typography>
                                {store.weekOffset !== 0 ? (
                                    <Button variant="contained" onClick={handleTodayClick} sx={todayButtonSx}>
                                        חזור להיום
                                    </Button>
                                ) : null}
                            </Box>
                        </Collapsible>
                        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            {/* Wraps onto two lines when narrow, so the dates never push the buttons out of the card */}
                            <Typography component="div" fontWeight={700} sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                columnGap: 1,
                                lineHeight: 1.35,
                                fontSize: compact ? {xs: '0.9rem', sm: '0.95rem'} : {xs: '1rem', sm: '1.15rem'},
                                transition: transition('font-size'),
                            }}>
                                <Box component="span" sx={{whiteSpace: 'nowrap'}}>{formatNavDate(weekDates[0])}</Box>
                                <Box component="span" sx={{whiteSpace: 'nowrap'}}>
                                    <Typography component="span" variant="body2" color="text.secondary"
                                                sx={{marginInlineEnd: 1, fontSize: 'inherit'}}>עד</Typography>
                                    {formatNavDate(weekDates[6])}
                                </Box>
                            </Typography>
                            {/* The caption with its "חזור להיום" is folded away in the compact pill, so it gets a short one here.
                                It stays mounted and grows from zero width with the rest of the shrink, so the dates slide aside
                                instead of jumping when it appears or disappears */}
                            <Box aria-hidden={!showCompactToday} sx={{
                                display: 'grid',
                                gridTemplateColumns: showCompactToday ? '1fr' : '0fr',
                                marginInlineStart: showCompactToday ? 0.75 : 0,
                                opacity: showCompactToday ? 1 : 0,
                                transition: transition('grid-template-columns', 'margin', 'opacity'),
                            }}>
                                <Box sx={{overflow: 'hidden', minWidth: 0}}>
                                    <Button variant="contained" onClick={handleTodayClick} aria-label="חזרה לשבוע הנוכחי"
                                            tabIndex={showCompactToday ? 0 : -1} sx={compactTodayButtonSx}>
                                        היום
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                    <IconButton sx={navButtonSx} onClick={handleNextWeekClick} aria-label="שבוע הבא">
                        <ChevronLeft fontSize={compact ? 'small' : 'medium'}/>
                    </IconButton>
                </Box>
                {actions ? (
                    <Collapsible open={!compact} transition={transition('grid-template-rows', 'opacity')}>
                        <Box display="flex" gap={1.5} pt={2}>{actions}</Box>
                    </Collapsible>
                ) : null}
            </Paper>
        </Box>
    );
});

const formatNavDate = (date: Date) =>
    date.toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit', year: 'numeric'});

export const formatDate = (date: Date) =>
    date.toLocaleDateString('he-IL', {month: 'numeric', day: 'numeric', year: 'numeric'});

export default CalendarNavigation;
