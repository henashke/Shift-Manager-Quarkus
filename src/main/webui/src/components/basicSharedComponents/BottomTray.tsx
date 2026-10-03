import React, {useState} from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Fade from '@mui/material/Fade';
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

const BottomTray: React.FC<BottomTrayProps> = ({title, names, forceOpen, children}) => {
    const [expanded, setExpanded] = useState(false);
    const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', {noSsr: true});
    const open = expanded || Boolean(forceOpen);
    const timeout = reduceMotion ? 0 : 320;
    const hiddenCount = names.length - MAX_DOTS;

    return (
        <>
            {/* Keeps the end of the page reachable above the collapsed tray */}
            <Box sx={{height: HEADER_HEIGHT + 16}}/>
            <Fade in={open} timeout={timeout}>
                <Box onClick={() => setExpanded(false)}
                     sx={{position: 'fixed', inset: 0, zIndex: theme => theme.zIndex.appBar - 2, bgcolor: 'rgba(0, 0, 0, 0.4)'}}/>
            </Fade>
            <Box sx={traySx}>
                <ButtonBase onClick={() => setExpanded(!open)} aria-expanded={open} sx={headerSx}>
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
                        transition: `transform ${timeout}ms ${easing}`,
                        transform: open ? 'rotate(180deg)' : 'none',
                    }}/>
                </ButtonBase>
                <Collapse in={open} timeout={timeout} easing={easing}>
                    <Box sx={{maxHeight: '50vh', overflowY: 'auto', px: 1, pb: 1}}>
                        {children}
                    </Box>
                </Collapse>
            </Box>
        </>
    );
};

export default BottomTray;
