import React from 'react';
import Box from '@mui/material/Box';
import {alpha, keyframes, SxProps, Theme} from '@mui/material/styles';

interface CardSkeletonProps {
    // Staggers the shimmer so neighboring cells form one wave across the table
    delayMs?: number;
}

const shimmer = keyframes`
    from {
        background-position: 150% 0;
    }
    to {
        background-position: -50% 0;
    }
`;

const appear = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

// The card is a muted block with a violet highlight sweeping across it
const cardSx: SxProps<Theme> = theme => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1,
    px: 1.5,
    py: 0.9,
    borderRadius: 2,
    border: '1px solid',
    borderColor: alpha(theme.palette.text.primary, 0.08),
    backgroundColor: alpha(theme.palette.text.primary, 0.04),
    backgroundImage: `linear-gradient(100deg, transparent 30%, ${alpha(theme.palette.primary.main, 0.16)} 50%, transparent 70%)`,
    backgroundSize: '200% 100%',
    backgroundRepeat: 'no-repeat',
    animation: `${appear} 300ms ease-out both, ${shimmer} 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
    '@media (prefers-reduced-motion: reduce)': {animation: 'none', backgroundImage: 'none'},
});

const barSx = (width: number, height: number): SxProps<Theme> => ({
    width,
    height,
    borderRadius: 1,
    bgcolor: theme => alpha(theme.palette.text.primary, 0.1),
});

// Stands in for a user card while its data loads, in the same shape so nothing jumps when it arrives
const CardSkeleton: React.FC<CardSkeletonProps> = ({delayMs = 0}) => (
    <Box aria-hidden sx={cardSx} style={{animationDelay: `0ms, ${delayMs}ms`}}>
        <Box sx={{width: 8, height: 8, borderRadius: '50%', bgcolor: theme => alpha(theme.palette.text.primary, 0.14)}}/>
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.6}}>
            <Box sx={barSx(52, 10)}/>
            <Box sx={barSx(34, 7)}/>
        </Box>
    </Box>
);

export default CardSkeleton;
