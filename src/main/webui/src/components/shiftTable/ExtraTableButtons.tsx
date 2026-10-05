import React from 'react';
import {observer} from 'mobx-react-lite';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import shiftStore from '../../stores/ShiftStore';

const rowSx = {display: 'flex', gap: 1.5, flexBasis: '100%'} as const;
const buttonSx = {flex: 1, py: 1} as const;

interface ExtraTableButtonsProps {
    onRename: (table: string) => void;
    onDelete: (table: string) => void;
}

// Rename and delete for the selected extra table, as a row of the calendar navigation's actions (admins only). Its own
// observer, so switching tables doesn't re-render the whole tab.
const ExtraTableButtons: React.FC<ExtraTableButtonsProps> = observer(({onRename, onDelete}) => {
    const table = shiftStore.activeTable;
    if (!table) return null;
    return (
        <Box sx={rowSx}>
            <Button variant="outlined" color="inherit" startIcon={<EditOutlined/>} onClick={() => onRename(table)}
                    sx={buttonSx}>
                שנה שם טבלה
            </Button>
            <Button variant="outlined" color="error" startIcon={<DeleteOutlineRounded/>} onClick={() => onDelete(table)}
                    sx={buttonSx}>
                מחק טבלה
            </Button>
        </Box>
    );
});

export default ExtraTableButtons;
