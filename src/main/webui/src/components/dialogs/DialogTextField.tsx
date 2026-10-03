import React, {useId} from 'react';
import Box from '@mui/material/Box';
import TextField, {TextFieldProps} from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// The label sits above the field: MUI's floating label stays on the left without an RTL style plugin
const DialogTextField: React.FC<Omit<TextFieldProps, 'label'> & { label: string, hint?: string }> = ({label, hint, ...props}) => {
    const id = useId();
    return (
        <Box>
            <Typography component="label" htmlFor={id} sx={{display: 'block', fontWeight: 600, fontSize: '0.9rem', mb: 0.75}}>
                {label}
            </Typography>
            <TextField id={id} fullWidth size="small" {...props}
                       sx={{'& .MuiOutlinedInput-root': {borderRadius: 2.5}, ...props.sx}}/>
            {hint ? (
                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 0.75}}>
                    {hint}
                </Typography>
            ) : null}
        </Box>
    );
};

export default DialogTextField;
