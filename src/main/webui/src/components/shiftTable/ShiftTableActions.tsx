import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import {keyframes, SxProps, Theme} from '@mui/material/styles';
import authStore from '../../stores/AuthStore';
import notificationStore from '../../stores/NotificationStore';
import {EASE_EXIT, EASE_SHEET, floatingSurface, primaryGradient} from '../../theme';

interface ShiftTableActionsProps {
    // Whether there are unsaved changes; the bar slides away on its own when this turns false
    open: boolean;
    onSave: () => void | Promise<unknown>;
    onCancel: () => void;
    requireAdmin?: boolean;
}

// Page space kept free under the content while the bar shows, so the last rows can scroll out from under it
const BAR_SPACE = '88px';
const EXIT_MS = 220;
// Where the bar comes up from and goes back down to
const OFFSTAGE = 'translateY(calc(100% + 24px)) scale(0.96)';

const slideUp = keyframes`
    from {
        opacity: 0;
        transform: ${OFFSTAGE};
    }
    to {
        opacity: 1;
        transform: none;
    }
`;

const ripple = keyframes`
    from {
        transform: scale(1);
        opacity: 0.6;
    }
    70%, to {
        transform: scale(2.6);
        opacity: 0;
    }
`;

// Fixed just above the users tray on phones (BottomTray sets --bottom-tray-height), at the bottom elsewhere. Under
// the tray's backdrop, so an opened tray covers it. Translucent, so the table stays visible through it (the toast's surface).
const barSx = (leaving: boolean): SxProps<Theme> => theme => ({
    position: 'fixed',
    insetInline: 16,
    bottom: 'calc(var(--bottom-tray-height, 0px) + env(safe-area-inset-bottom) + 12px)',
    zIndex: theme.zIndex.appBar - 3,
    maxWidth: 600,
    mx: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    p: 1.25,
    paddingInlineStart: 2,
    borderRadius: '18px',
    ...floatingSurface(theme),
    animation: `${slideUp} 460ms ${EASE_SHEET}`,
    transform: leaving ? OFFSTAGE : 'none',
    opacity: leaving ? 0 : 1,
    transition: `transform ${EXIT_MS}ms ${EASE_EXIT}, opacity ${EXIT_MS}ms ${EASE_EXIT}`,
    pointerEvents: leaving ? 'none' : 'auto',
    '@media (prefers-reduced-motion: reduce)': {animation: 'none', transform: 'none'},
});

// The pending color, with a slow ring going out from it: something is waiting to be saved
const pendingDotSx: SxProps<Theme> = {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
    bgcolor: 'secondary.main',
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        bgcolor: 'secondary.main',
        animation: `${ripple} 2.4s ${EASE_EXIT} infinite`,
    },
    '@media (prefers-reduced-motion: reduce)': {'&::after': {display: 'none'}},
};

// Save / cancel for pending (unsaved) changes, as a bar stuck to the bottom of the screen
const ShiftTableActions: React.FC<ShiftTableActionsProps> = ({open, onSave, onCancel, requireAdmin = true}) => {
    // Stays mounted after `open` turns false until it has slid away
    const [mounted, setMounted] = useState(open);
    const [saving, setSaving] = useState(false);
    const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', {noSsr: true});

    useEffect(() => {
        if (open) {
            setMounted(true);
            return;
        }
        const timer = window.setTimeout(() => setMounted(false), reduceMotion ? 0 : EXIT_MS);
        return () => window.clearTimeout(timer);
    }, [open, reduceMotion]);

    useEffect(() => {
        if (!open) return;
        const root = document.documentElement;
        root.style.setProperty('--save-bar-space', BAR_SPACE);
        return () => {
            root.style.removeProperty('--save-bar-space');
        };
    }, [open]);

    if (!mounted) return null;

    const guard = (action: () => void | Promise<unknown>) => async () => {
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        const result = action();
        if (!(result instanceof Promise)) return;
        setSaving(true);
        try {
            await result;
        } finally {
            setSaving(false);
        }
    };

    return (
        <Paper role="region" aria-label="שינויים שלא נשמרו" sx={barSx(!open)}>
            {/* The dot is the pending color, the same as unsaved cards in the table */}
            <Box sx={pendingDotSx}/>
            <Typography sx={{flex: 1, minWidth: 0, fontWeight: 600, fontSize: '0.9rem'}} noWrap>
                שינויים שלא נשמרו
            </Typography>
            <Button variant="outlined" color="inherit" onClick={guard(onCancel)} disabled={saving}>בטל</Button>
            <Button variant="contained" onClick={guard(onSave)} disabled={saving} aria-busy={saving}
                    sx={{minWidth: 76, '&.Mui-disabled': {background: primaryGradient, color: 'common.white', opacity: 0.85}}}>
                {saving ? <CircularProgress size={18} color="inherit"/> : 'שמור'}
            </Button>
        </Paper>
    );
};

export default ShiftTableActions;
