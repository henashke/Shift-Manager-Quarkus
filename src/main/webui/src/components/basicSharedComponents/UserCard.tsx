import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {alpha, useTheme} from '@mui/material/styles';
import {stringToColor} from "../shiftTable/ShiftTable";

interface UserCardProps {
    name: string;
    shiftType?: string;
    isPending?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({name, shiftType, isPending}) => {
    const theme = useTheme();
    const color = isPending ? theme.palette.secondary.main : stringToColor(name);

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: shiftType ? 0.75 : 1,
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
                    {name}
                </Typography>
                {shiftType ? (
                    <Typography noWrap variant="caption" sx={{color: 'text.secondary', lineHeight: 1.2}}>
                        {shiftType}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    );
};

export default UserCard;
