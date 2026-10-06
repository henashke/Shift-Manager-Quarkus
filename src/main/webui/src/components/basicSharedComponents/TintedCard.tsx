import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {alpha, keyframes} from '@mui/material/styles';
import {EASE_SETTLE} from '../../theme';

interface TintedCardProps {
    label: string;
    subtitle?: string;
    // Any CSS color; the card uses it for the dot and, faded, for the fill and border
    color: string;
    // Border only, no fill: a secondary item next to regular cards (e.g. a shift's shadow or jump assignee)
    outlined?: boolean;
    small?: boolean;
    // Pops in when it mounts: for an item that was just placed (a pending assignment)
    appear?: boolean;
}

const popIn = keyframes`
    from {
        opacity: 0;
        transform: scale(0.85);
    }
    to {
        opacity: 1;
        transform: none;
    }
`;

// The card look shared by users (UserCard) and constraint types
const TintedCard: React.FC<TintedCardProps> = ({label, subtitle, color, outlined, small, appear}) => (
    <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: small ? 0.75 : 1,
        px: small ? 1 : 1.5,
        py: small ? 0.5 : subtitle ? 0.75 : 1,
        minWidth: 0,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(color, 0.6),
        backgroundColor: outlined ? 'transparent' : alpha(color, 0.12),
        color: 'text.primary',
        userSelect: 'none',
        transition: 'background-color 0.3s, border-color 0.3s',
        animation: appear ? `${popIn} 380ms ${EASE_SETTLE}` : 'none',
        '@media (prefers-reduced-motion: reduce)': {animation: 'none'},
        '&:hover': {
            borderColor: color,
            backgroundColor: alpha(color, outlined ? 0.08 : 0.2),
        },
    }}>
        <Box sx={{width: small ? 6 : 8, height: small ? 6 : 8, borderRadius: '50%', flexShrink: 0, bgcolor: color}}/>
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, lineHeight: 1.2}}>
            <Typography noWrap sx={{fontWeight: 700, fontSize: small ? '0.8rem' : '0.95rem', lineHeight: 1.2}}>
                {label}
            </Typography>
            {subtitle ? (
                <Typography noWrap variant="caption"
                            sx={{color: 'text.secondary', lineHeight: 1.2, fontSize: small ? '0.68rem' : undefined}}>
                    {subtitle}
                </Typography>
            ) : null}
        </Box>
    </Box>
);

export default TintedCard;
