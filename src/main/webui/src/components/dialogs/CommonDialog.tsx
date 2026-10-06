import React, {useId} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import {alpha, SxProps, Theme} from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import {EASE_EXIT, EASE_SHEET} from '../../theme';

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
    // False when the dialog closes itself after an async confirm (e.g. to stay open and show an error)
    closeOnConfirm?: boolean;
    // Only the confirm button, for dialogs with nothing to cancel (e.g. an announcement)
    hideCancel?: boolean;
}

// The dialog rises into place as it fades in and sinks back the same way as it fades out. MUI fades the container;
// these move the card itself.
const ENTER_MS = 420;
const EXIT_MS = 200;
const RESTING_OFFSTAGE = 'translateY(16px) scale(0.96)';
const paperOf = (node: HTMLElement) => node.querySelector<HTMLElement>('.MuiDialog-paper');
const motionHandlers = {
    onEnter: (node: HTMLElement) => {
        const paper = paperOf(node);
        if (!paper) return;
        paper.style.transition = 'none';
        paper.style.transform = RESTING_OFFSTAGE;
    },
    onEntering: (node: HTMLElement) => {
        const paper = paperOf(node);
        if (!paper) return;
        void paper.offsetHeight;
        paper.style.transition = `transform ${ENTER_MS}ms ${EASE_SHEET}`;
        paper.style.transform = 'none';
    },
    onExit: (node: HTMLElement) => {
        const paper = paperOf(node);
        if (!paper) return;
        paper.style.transition = `transform ${EXIT_MS}ms ${EASE_EXIT}`;
        paper.style.transform = RESTING_OFFSTAGE;
    },
};
const transitionDuration = {enter: ENTER_MS * 0.6, exit: EXIT_MS};

const paperSx: SxProps<Theme> = {
    m: 2,
    width: 'calc(100% - 32px)',
    maxWidth: 440,
    borderRadius: 4,
    border: '1px solid',
    borderColor: 'divider',
    backgroundImage: 'none',
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.35)',
};

const backdropSx: SxProps<Theme> = {
    backgroundColor: 'rgba(10, 10, 14, 0.55)',
    backdropFilter: 'blur(4px)',
};

const actionButtonSx: SxProps<Theme> = {flex: 1, py: 1.1};


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
                                                       disableConfirmButton,
                                                       closeOnConfirm = true,
                                                       hideCancel
                                                   }) => {
    const handleConfirmInternal = () => {
        handleConfirm?.();
        if (closeOnConfirm) handleDialogClose();
    };
    const titleId = useId();
    const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', {noSsr: true});

    return (
        <Dialog open={open} onClose={handleDialogClose} aria-labelledby={titleId} transitionDuration={transitionDuration}
                slotProps={{
                    paper: {dir: 'rtl', sx: paperSx},
                    backdrop: {sx: backdropSx},
                    transition: reduceMotion ? undefined : motionHandlers,
                }}>
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
                    <Button variant="contained" color={danger ? 'error' : 'primary'}
                            onClick={handleConfirmInternal} disabled={disableConfirmButton}
                            sx={actionButtonSx}>
                        {confirmLabel}
                    </Button>
                    {hideCancel ? null : (
                        <Button variant="outlined" color="inherit" onClick={handleDialogClose} sx={actionButtonSx}>
                            {cancelLabel}
                        </Button>
                    )}
                </Box>
            ) : null}
        </Dialog>
    );
}

export default CommonDialog;
