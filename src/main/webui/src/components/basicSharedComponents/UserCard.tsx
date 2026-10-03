import React from 'react';
import {useTheme} from '@mui/material/styles';
import TintedCard from './TintedCard';
import {stringToColor} from "../shiftTable/ShiftTable";

interface UserCardProps {
    name: string;
    subtitle?: string;
    isPending?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({name, subtitle, isPending}) => {
    const theme = useTheme();
    const color = isPending ? theme.palette.secondary.main : stringToColor(name);
    return <TintedCard label={name} subtitle={subtitle} color={color}/>;
};

export default UserCard;
