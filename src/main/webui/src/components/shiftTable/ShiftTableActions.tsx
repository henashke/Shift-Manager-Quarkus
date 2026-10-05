import React, {useEffect} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import {keyframes, SxProps, Theme} from '@mui/material/styles';
import authStore from '../../stores/AuthStore';
import notificationStore from '../../stores/NotificationStore';

interface ShiftTableActionsProps {
    onSave: () => void;
    onCancel: () => void;
    requireAdmin?: boolean;
}

// Page space kept free under the content while the bar shows, so the last rows can scroll out from under it
const BAR_SPACE = '88px';

const slideUp = keyframes`
    from {
        opacity: 0;
        transform: translateY(24px);
    }
    to {
        opacity: 1;
        transform: none;
    }
`;

// Fixed just above the users tray on phones (BottomTray sets --bottom-tray-height), at the bottom elsewhere. Under
// the tray's backdrop, so an opened tray covers it.
const barSx: SxProps<Theme> = {
    position: 'fixed',
    insetInline: 16,
    bottom: 'calc(var(--bottom-tray-height, 0px) + env(safe-area-inset-bottom) + 12px)',
    zIndex: theme => theme.zIndex.appBar - 3,
    maxWidth: 600,
    mx: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    p: 1.25,
    paddingInlineStart: 2,
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
    animation: `${slideUp} 260ms cubic-bezier(0.2, 0.9, 0.3, 1)`,
    '@media (prefers-reduced-motion: reduce)': {animation: 'none'},
};

const pendingDotSx: SxProps<Theme> = {width: 10, height: 10, borderRadius: '50%', flexShrink: 0, bgcolor: 'secondary.main'};

// Save / cancel for pending (unsaved) changes, as a bar stuck to the bottom of the screen
const ShiftTableActions: React.FC<ShiftTableActionsProps> = ({onSave, onCancel, requireAdmin = true}) => {
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--save-bar-space', BAR_SPACE);
        return () => {
            root.style.removeProperty('--save-bar-space');
        };
    }, []);

    const guard = (action: () => void) => () => {
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        action();
    };

    return (
        <Paper role="region" aria-label="שינויים שלא נשמרו" sx={barSx}>
            {/* The dot is the pending color, the same as unsaved cards in the table */}
            <Box sx={pendingDotSx}/>
            <Typography sx={{flex: 1, minWidth: 0, fontWeight: 600, fontSize: '0.9rem'}} noWrap>
                שינויים שלא נשמרו
            </Typography>
            <Button variant="outlined" color="inherit" onClick={guard(onCancel)}>בטל</Button>
            <Button variant="contained" onClick={guard(onSave)}>שמור</Button>
        </Paper>
    );
};

export default ShiftTableActions;
