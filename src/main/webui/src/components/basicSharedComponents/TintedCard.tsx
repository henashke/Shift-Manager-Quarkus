import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {alpha} from '@mui/material/styles';

interface TintedCardProps {
    label: string;
    subtitle?: string;
    // Any CSS color; the card uses it for the dot and, faded, for the fill and border
    color: string;
}

// The card look shared by users (UserCard) and constraint types
const TintedCard: React.FC<TintedCardProps> = ({label, subtitle, color}) => (
    <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: subtitle ? 0.75 : 1,
        minWidth: 0,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(color, 0.6),
        backgroundColor: alpha(color, 0.12),
        color: 'text.primary',
        userSelect: 'none',
        transition: 'background-color 0.2s, border-color 0.2s',
        '&:hover': {
            borderColor: color,
            backgroundColor: alpha(color, 0.2),
        },
    }}>
        <Box sx={{width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: color}}/>
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, lineHeight: 1.2}}>
            <Typography noWrap sx={{fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2}}>
                {label}
            </Typography>
            {subtitle ? (
                <Typography noWrap variant="caption" sx={{color: 'text.secondary', lineHeight: 1.2}}>
                    {subtitle}
                </Typography>
            ) : null}
        </Box>
    </Box>
);

export default TintedCard;
