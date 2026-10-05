import React, {useEffect, useRef} from 'react';
import {observer} from 'mobx-react-lite';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import {SxProps, Theme} from '@mui/material/styles';
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
const MOVE_MS = 380;
// The outgoing layer fades quickly, the incoming one a little later, so they cross cleanly instead of overlapping
const FADE_OUT = '150ms ease-in';
const FADE_IN = '230ms ease-out 70ms';
// How far the full card's date row sits below the pill's, measured and set on the wrapper: the full card slides up by
// it while the pill comes up from it, so both date rows meet on one line and the switch reads as one row shrinking
const GAP = 'var(--dates-gap, 0px)';

// Both layers only animate transform and opacity, CSS transitions the GPU runs on its own, so it stays smooth on phones
const fullLayerSx = (compact: boolean, animate: boolean): SxProps<Theme> => ({
    position: 'relative',
    mx: 'auto',
    maxWidth: 600,
    p: 2,
    borderRadius: 3,
    boxShadow: 3,
    transformOrigin: 'top center',
    transform: compact ? `translateY(calc(-1 * ${GAP})) scale(0.96)` : 'none',
    opacity: compact ? 0 : 1,
    transition: animate ? `transform ${MOVE_MS}ms ${EASING}, opacity ${compact ? FADE_OUT : FADE_IN}` : 'none',
    willChange: 'transform, opacity',
    pointerEvents: compact ? 'none' : 'auto',
});

// The compact pill sits over the top of the full card
const pillLayerSx = (compact: boolean, animate: boolean): SxProps<Theme> => ({
    position: 'absolute',
    top: 0,
    insetInline: 0,
    mx: 'auto',
    maxWidth: 360,
    p: 0.75,
    borderRadius: '28px',
    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
    transform: compact ? 'none' : `translateY(${GAP}) scale(0.94)`,
    opacity: compact ? 1 : 0,
    transition: animate ? `transform ${MOVE_MS}ms ${EASING}, opacity ${compact ? FADE_IN : FADE_OUT}` : 'none',
    willChange: 'transform, opacity',
    pointerEvents: compact ? 'auto' : 'none',
    cursor: 'pointer',
});

const fullNavButtonSx: SxProps<Theme> = {
    width: 40,
    height: 40,
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    flexShrink: 0,
};

const pillNavButtonSx: SxProps<Theme> = {...fullNavButtonSx, width: 32, height: 32, borderRadius: '50%'};

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
    whiteSpace: 'nowrap',
} as const;

const weekOffsetLabel = (offset: number) => {
    const weeks = Math.abs(offset);
    const amount = weeks === 1 ? 'שבוע' : weeks === 2 ? 'שבועיים' : `${weeks} שבועות`;
    if (offset === 0) return 'השבוע הנוכחי';
    return offset < 0 ? `לפני ${amount}` : `עוד ${amount}`;
};

const DateRange: React.FC<{ dates: Date[], fontSize: object | string }> = ({dates, fontSize}) => (
    // Wraps onto two lines when narrow, so the dates never push the buttons out of the card
    <Typography component="div" fontWeight={700} sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: 1,
        lineHeight: 1.35,
        fontSize,
    }}>
        <Box component="span" sx={{whiteSpace: 'nowrap'}}>{formatNavDate(dates[0])}</Box>
        <Box component="span" sx={{whiteSpace: 'nowrap'}}>
            <Typography component="span" variant="body2" color="text.secondary"
                        sx={{marginInlineEnd: 1, fontSize: 'inherit'}}>עד</Typography>
            {formatNavDate(dates[6])}
        </Box>
    </Typography>
);

/**
 * Sticks below the top bar and, like Safari's toolbar on iPhone, switches to a compact pill when you scroll down and
 * back to full size when you scroll up, reach the top or tap the pill. The full card and the pill are two layers that
 * cross-fade and slide into each other.
 */
const CalendarNavigation: React.FC<CalendarNavigationProps> = observer(({actions}) => {
    const weekDates = store.weekDates;
    const handlePrevWeekClick = () => store.setWeekOffset(store.weekOffset - 1);
    const handleNextWeekClick = () => store.setWeekOffset(store.weekOffset + 1);
    const handleTodayClick = () => store.setWeekOffset(0);

    const [compact, setCompact] = useCompactOnScroll();
    const animate = !useMediaQuery('(prefers-reduced-motion: reduce)', {noSsr: true});

    const wrapperRef = useRef<HTMLDivElement>(null);
    const fullRef = useRef<HTMLDivElement>(null);
    const pillRef = useRef<HTMLDivElement>(null);
    const fullDatesRef = useRef<HTMLDivElement>(null);
    const pillDatesRef = useRef<HTMLDivElement>(null);

    // The gap between the two date rows, kept current as the card's size changes. Offsets ignore transforms, and each
    // row's offset parent is its layer. Written on the next frame, outside the observer's callback.
    useEffect(() => {
        const full = fullRef.current;
        if (!full) return;
        let frame = 0;
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const a = fullDatesRef.current;
                const b = pillDatesRef.current;
                if (!a || !b || !wrapperRef.current) return;
                const gap = (a.offsetTop + a.offsetHeight / 2) - (b.offsetTop + b.offsetHeight / 2);
                wrapperRef.current.style.setProperty('--dates-gap', `${gap}px`);
            });
        });
        observer.observe(full);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, []);

    // Only the visible layer can be reached by the keyboard or a screen reader
    useEffect(() => {
        fullRef.current?.toggleAttribute('inert', compact);
        pillRef.current?.toggleAttribute('inert', !compact);
    }, [compact]);

    const expandOnTap = (e: React.MouseEvent) => {
        if (!(e.target as HTMLElement).closest('button')) setCompact(false);
    };

    return (
        <Box ref={wrapperRef} sx={{
            position: 'sticky',
            top: STICKY_TOP_PX,
            zIndex: theme => theme.zIndex.appBar - 3,
            mb: 2,
            // Only the visible layer takes clicks; the rest lets the table underneath be used
            pointerEvents: 'none',
        }}>
            {/* The full card stays in the layout at full size the whole time, so the page below never moves */}
            <Paper ref={fullRef} sx={fullLayerSx(compact, animate)}>
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1}}>
                    <IconButton sx={fullNavButtonSx} onClick={handlePrevWeekClick} aria-label="שבוע קודם">
                        <ChevronRight/>
                    </IconButton>
                    <Box display="flex" flexDirection="column" alignItems="center" sx={{minWidth: 0, textAlign: 'center'}}>
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
                        <Box ref={fullDatesRef}><DateRange dates={weekDates} fontSize={{xs: '1rem', sm: '1.15rem'}}/></Box>
                    </Box>
                    <IconButton sx={fullNavButtonSx} onClick={handleNextWeekClick} aria-label="שבוע הבא">
                        <ChevronLeft/>
                    </IconButton>
                </Box>
                {actions ? <Box display="flex" gap={1.5} pt={2}>{actions}</Box> : null}
            </Paper>

            <Paper ref={pillRef} onClick={expandOnTap} sx={pillLayerSx(compact, animate)}>
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1}}>
                    <IconButton sx={pillNavButtonSx} onClick={handlePrevWeekClick} aria-label="שבוע קודם">
                        <ChevronRight fontSize="small"/>
                    </IconButton>
                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, minWidth: 0}}>
                        <Box ref={pillDatesRef}><DateRange dates={weekDates} fontSize={{xs: '0.9rem', sm: '0.95rem'}}/></Box>
                        {store.weekOffset !== 0 ? (
                            <Button variant="contained" onClick={handleTodayClick} aria-label="חזרה לשבוע הנוכחי"
                                    sx={todayButtonSx}>
                                היום
                            </Button>
                        ) : null}
                    </Box>
                    <IconButton sx={pillNavButtonSx} onClick={handleNextWeekClick} aria-label="שבוע הבא">
                        <ChevronLeft fontSize="small"/>
                    </IconButton>
                </Box>
            </Paper>
        </Box>
    );
});

const formatNavDate = (date: Date) =>
    date.toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit', year: 'numeric'});

export const formatDate = (date: Date) =>
    date.toLocaleDateString('he-IL', {month: 'numeric', day: 'numeric', year: 'numeric'});

export default CalendarNavigation;
