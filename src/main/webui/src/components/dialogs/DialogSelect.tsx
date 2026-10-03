import React, {useId} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NativeSelect from "../basicSharedComponents/NativeSelect";

interface DialogSelectProps {
    label: string;
    options: string[];
    defaultValue?: string;
    onChange: (value: string) => void;
}

// A native select so phones open their own picker (e.g. iOS's), with the label above it like DialogTextField
const DialogSelect: React.FC<DialogSelectProps> = ({label, options, defaultValue, onChange}) => {
    const id = useId();
    return (
        <Box>
            <Typography component="label" htmlFor={id} sx={{display: 'block', fontWeight: 600, fontSize: '0.9rem', mb: 0.75}}>
                {label}
            </Typography>
            <NativeSelect id={id} title={label} options={options} defaultValue={defaultValue} fullWidth
                          onChange={e => onChange(e.target.value)}/>
        </Box>
    );
};

export default DialogSelect;
