import React, {useId} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import {alpha, keyframes, SxProps, Theme} from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

export interface CommonDialogProps {
    open: boolean;
    title: string;
    // One line under the title saying what the dialog is about or what will happen
    description?: React.ReactNode;
    icon?: React.ReactNode;
    content?: React.ReactNode;
    // Without it the dialog has no action buttons, only the close button (e.g. an info dialog)
    handleConfirm?: (param?: any) => void;
    handleDialogClose: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    // Red icon and confirm button, for actions that delete or reset data
    danger?: boolean;
    disableConfirmButton?: boolean;
}

const settle = keyframes`
    from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: none;
    }
`;

const paperSx: SxProps<Theme> = {
    m: 2,
    width: 'calc(100% - 32px)',
    maxWidth: 440,
    borderRadius: 4,
    border: '1px solid',
    borderColor: 'divider',
    backgroundImage: 'none',
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.35)',
    animation: `${settle} 220ms cubic-bezier(0.2, 0.9, 0.3, 1)`,
    '@media (prefers-reduced-motion: reduce)': {animation: 'none'},
};

const backdropSx: SxProps<Theme> = {
    backgroundColor: 'rgba(10, 10, 14, 0.55)',
    backdropFilter: 'blur(4px)',
};

const actionButtonSx: SxProps<Theme> = {flex: 1, py: 1.1, borderRadius: 2.5, fontWeight: 700};

const confirmSx: SxProps<Theme> = {
    ...actionButtonSx,
    background: theme => `linear-gradient(90deg, ${theme.palette.primary.main}, #8b5cf6)`,
    '&.Mui-disabled': {background: theme => theme.palette.action.disabledBackground},
};

const CommonDialog: React.FC<CommonDialogProps> = ({
                                                       open,
                                                       title,
                                                       description,
                                                       icon,
                                                       content,
                                                       handleDialogClose,
                                                       handleConfirm,
                                                       confirmLabel = 'אישור',
                                                       cancelLabel = 'ביטול',
                                                       danger,
                                                       disableConfirmButton
                                                   }) => {
    const handleConfirmInternal = () => {
        handleConfirm?.();
        handleDialogClose();
    };
    const titleId = useId();

    return (
        <Dialog open={open} onClose={handleDialogClose} aria-labelledby={titleId}
                slotProps={{paper: {dir: 'rtl', sx: paperSx}, backdrop: {sx: backdropSx}}}>
            <Box sx={{display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2.5, pb: content ? 2 : 1}}>
                {icon ? (
                    <Box sx={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 2.5,
                        color: danger ? 'error.main' : 'primary.light',
                        bgcolor: theme => alpha(danger ? theme.palette.error.main : theme.palette.primary.main, 0.16),
                    }}>
                        {icon}
                    </Box>
                ) : null}
                <Box sx={{flex: 1, minWidth: 0, pt: icon ? 0.25 : 0}}>
                    <Typography id={titleId} component="h2" sx={{fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.4}}>
                        {title}
                    </Typography>
                    {description ? (
                        <Typography variant="body2" color="text.secondary" sx={{mt: 0.5, lineHeight: 1.6}}>
                            {description}
                        </Typography>
                    ) : null}
                </Box>
                <IconButton onClick={handleDialogClose} aria-label="סגירה" size="small"
                            sx={{mt: -0.5, marginInlineEnd: -1, color: 'text.secondary'}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </Box>
            {content ? <Box sx={{px: 2.5, pb: handleConfirm ? 1 : 2.5}}>{content}</Box> : null}
            {handleConfirm ? (
                <Box sx={{display: 'flex', gap: 1, p: 2.5, pt: 2}}>
                    <Button variant="contained" color={danger ? 'error' : 'primary'} disableElevation
                            onClick={handleConfirmInternal} disabled={disableConfirmButton}
                            sx={danger ? actionButtonSx : confirmSx}>
                        {confirmLabel}
                    </Button>
                    <Button variant="outlined" color="inherit" onClick={handleDialogClose}
                            sx={{...actionButtonSx, borderColor: 'divider'}}>
                        {cancelLabel}
                    </Button>
                </Box>
            ) : null}
        </Dialog>
    );
}

export default CommonDialog;
