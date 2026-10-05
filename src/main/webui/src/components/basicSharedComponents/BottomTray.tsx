import React, {useEffect, useRef, useState} from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import {SxProps, Theme} from '@mui/material/styles';
import ExpandLess from '@mui/icons-material/ExpandLess';
import {stringToColor} from "../shiftTable/ShiftTable";

interface BottomTrayProps {
    title: string;
    // Names shown as color dots in the collapsed header, in each user's card color
    names: string[];
    // Keeps the tray open regardless of the toggle, e.g. while something is dragged onto it
    forceOpen?: boolean;
    children: React.ReactNode;
}

const HEADER_HEIGHT = 56;
const MAX_DOTS = 6;
// Decelerate into place, like a sheet settling
const easing = 'cubic-bezier(0.2, 0.9, 0.3, 1)';
// A release faster than this (px/ms) follows the flick's direction instead of the nearest position
const FLICK_VELOCITY = 0.4;
// Less movement than this is a tap, which toggles the tray
const TAP_SLOP_PX = 5;
// Closed, the sheet is pushed down so only its header (and the safe area below it) shows
const CLOSED_TRANSFORM = `translateY(calc(100% - ${HEADER_HEIGHT}px - env(safe-area-inset-bottom)))`;

const traySx: SxProps<Theme> = {
    position: 'fixed',
    insetInline: 0,
    bottom: 0,
    zIndex: theme => theme.zIndex.appBar - 1,
    bgcolor: 'background.paper',
    backgroundImage: 'none',
    borderTop: '1px solid',
    borderColor: 'divider',
    borderRadius: '16px 16px 0 0',
    boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.25)',
    pb: 'env(safe-area-inset-bottom)',
};

const headerSx: SxProps<Theme> = {
    width: '100%',
    height: HEADER_HEIGHT,
    px: 2,
    gap: 1.5,
    justifyContent: 'flex-start',
    position: 'relative',
    borderRadius: '16px 16px 0 0',
    // The header is the drag handle: the browser shouldn't scroll the page while it's dragged
    touchAction: 'none',
    cursor: 'grab',
    '&:active': {cursor: 'grabbing'},
    '&.Mui-focusVisible': {outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2},
};

const handleSx: SxProps<Theme> = {
    position: 'absolute',
    top: 6,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 36,
    height: 4,
    borderRadius: 2,
    bgcolor: 'divider',
};

interface DragState {
    startY: number;
    startOffset: number;
    closedOffset: number;
    offset: number;
    // Recent positions, for the release speed
    samples: { y: number, time: number }[];
    moved: boolean;
}

// Speed over the last VELOCITY_WINDOW_MS of movement; a single pair of samples is too noisy to tell a flick
const VELOCITY_WINDOW_MS = 100;
const releaseVelocity = (samples: DragState['samples']) => {
    const last = samples[samples.length - 1];
    const first = samples.find(s => last.time - s.time <= VELOCITY_WINDOW_MS) ?? last;
    return last.time > first.time ? (last.y - first.y) / (last.time - first.time) : 0;
};

const BottomTray: React.FC<BottomTrayProps> = ({title, names, forceOpen, children}) => {
    const [expanded, setExpanded] = useState(false);
    const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', {noSsr: true});
    const open = expanded || Boolean(forceOpen);
    const duration = reduceMotion ? 0 : 320;
    const hiddenCount = names.length - MAX_DOTS;

    const trayRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const drag = useRef<DragState | null>(null);
    // Set when a drag ends, so the click that follows the pointer release doesn't toggle the tray again
    const suppressClick = useRef(false);

    // Off-screen cards shouldn't be reachable with the keyboard or a screen reader
    useEffect(() => {
        contentRef.current?.toggleAttribute('inert', !open);
    }, [open]);

    // While dragging, move the sheet and dim the page directly, without re-rendering
    const applyDragOffset = (offset: number, closedOffset: number) => {
        if (trayRef.current) trayRef.current.style.transform = `translateY(${offset}px)`;
        if (backdropRef.current) backdropRef.current.style.opacity = String(1 - offset / closedOffset);
    };

    const clearDragStyles = () => {
        for (const el of [trayRef.current, backdropRef.current]) {
            if (!el) continue;
            el.style.transition = '';
            el.style.transform = '';
            el.style.opacity = '';
        }
    };

    const onPointerDown = (e: React.PointerEvent) => {
        // A touch drag isn't followed by a click, so a leftover flag must not swallow this new press's click
        suppressClick.current = false;
        const tray = trayRef.current;
        if (!tray || (e.pointerType === 'mouse' && e.button !== 0)) return;
        const closedOffset = tray.offsetHeight - HEADER_HEIGHT - parseFloat(getComputedStyle(tray).paddingBottom || '0');
        const startOffset = open ? 0 : closedOffset;
        drag.current = {
            startY: e.clientY, startOffset, closedOffset, offset: startOffset,
            samples: [{y: e.clientY, time: e.timeStamp}], moved: false,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        const d = drag.current;
        if (!d) return;
        const dy = e.clientY - d.startY;
        if (!d.moved) {
            if (Math.abs(dy) < TAP_SLOP_PX) return;
            d.moved = true;
            for (const el of [trayRef.current, backdropRef.current]) if (el) el.style.transition = 'none';
            if (backdropRef.current) backdropRef.current.style.pointerEvents = 'none';
        }
        d.samples.push({y: e.clientY, time: e.timeStamp});
        if (d.samples.length > 20) d.samples.shift();
        d.offset = Math.min(Math.max(d.startOffset + dy, 0), d.closedOffset);
        applyDragOffset(d.offset, d.closedOffset);
    };

    const endDrag = () => {
        const d = drag.current;
        drag.current = null;
        if (!d?.moved) return;
        suppressClick.current = true;
        const velocity = releaseVelocity(d.samples);
        const shouldOpen = Math.abs(velocity) > FLICK_VELOCITY ? velocity < 0 : d.offset < d.closedOffset / 2;
        if (backdropRef.current) backdropRef.current.style.pointerEvents = '';
        // Hand the position back to the styles below, whose transition settles the sheet
        clearDragStyles();
        setExpanded(shouldOpen);
    };

    const onHeaderClick = () => {
        if (suppressClick.current) {
            suppressClick.current = false;
            return;
        }
        setExpanded(!open);
    };

    return (
        <>
            {/* Exactly the collapsed tray's height, so the page ends right above it with only the content's own margin */}
            <Box sx={{height: `calc(${HEADER_HEIGHT}px + env(safe-area-inset-bottom))`}}/>
            <Box ref={backdropRef} onClick={() => setExpanded(false)} sx={{
                position: 'fixed',
                inset: 0,
                zIndex: theme => theme.zIndex.appBar - 2,
                bgcolor: 'rgba(0, 0, 0, 0.4)',
                opacity: open ? 1 : 0,
                pointerEvents: open ? 'auto' : 'none',
                transition: `opacity ${duration}ms ${easing}`,
            }}/>
            <Box ref={trayRef} sx={{
                ...traySx,
                transform: open ? 'none' : CLOSED_TRANSFORM,
                transition: `transform ${duration}ms ${easing}`,
            } as SxProps<Theme>}>
                <ButtonBase onClick={onHeaderClick} aria-expanded={open} sx={headerSx}
                            onPointerDown={onPointerDown} onPointerMove={onPointerMove}
                            onPointerUp={endDrag} onPointerCancel={endDrag}>
                    <Box sx={handleSx}/>
                    <Typography sx={{fontWeight: 700}}>{title}</Typography>
                    <Box sx={{
                        px: 1,
                        borderRadius: 1.5,
                        bgcolor: 'action.selected',
                        color: 'text.secondary',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        lineHeight: '22px',
                    }}>
                        {names.length}
                    </Box>
                    <Box sx={{flex: 1}}/>
                    <Box aria-hidden sx={{display: 'flex', alignItems: 'center'}}>
                        {names.slice(0, MAX_DOTS).map(name => (
                            <Box key={name} sx={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                bgcolor: stringToColor(name),
                                border: '2px solid',
                                borderColor: 'background.paper',
                                marginInlineStart: '-4px',
                            }}/>
                        ))}
                        {hiddenCount > 0 ? (
                            <Typography variant="caption" color="text.secondary" dir="ltr" sx={{marginInlineStart: 0.5}}>
                                +{hiddenCount}
                            </Typography>
                        ) : null}
                    </Box>
                    <ExpandLess sx={{
                        color: 'text.secondary',
                        transition: `transform ${duration}ms ${easing}`,
                        transform: open ? 'rotate(180deg)' : 'none',
                    }}/>
                </ButtonBase>
                <Box ref={contentRef} sx={{maxHeight: '50vh', overflowY: 'auto', px: 1, pb: 1}}>
                    {children}
                </Box>
            </Box>
        </>
    );
};

export default BottomTray;
