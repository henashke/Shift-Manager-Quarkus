import React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import {alpha} from '@mui/material/styles';

interface OptionGridProps {
    label: string;
    options: string[];
    value?: string;
    onChange: (value: string) => void;
}

// A single-choice picker of tappable tiles, in place of a native select inside dialogs
const OptionGrid: React.FC<OptionGridProps> = ({label, options, value, onChange}) => (
    <Box role="radiogroup" aria-label={label}
         sx={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: 1}}>
        {options.map(option => {
            const selected = option === value;
            return (
                <ButtonBase key={option} role="radio" aria-checked={selected} onClick={() => onChange(option)}
                            sx={{
                                justifyContent: 'flex-start',
                                gap: 1,
                                px: 1.5,
                                py: 1.25,
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: selected ? 'primary.main' : 'divider',
                                bgcolor: theme => selected ? alpha(theme.palette.primary.main, 0.16) : 'transparent',
                                fontWeight: selected ? 700 : 500,
                                fontSize: '0.95rem',
                                transition: 'background-color 150ms, border-color 150ms',
                                '&:hover': {borderColor: selected ? 'primary.main' : 'text.secondary'},
                                '&.Mui-focusVisible': {outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2},
                            }}>
                    <Box sx={{
                        width: 14,
                        height: 14,
                        flexShrink: 0,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: selected ? 'primary.main' : 'text.disabled',
                        boxShadow: theme => selected ? `inset 0 0 0 2px ${theme.palette.background.paper}` : 'none',
                        bgcolor: selected ? 'primary.main' : 'transparent',
                    }}/>
                    <Box component="span" sx={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {option}
                    </Box>
                </ButtonBase>
            );
        })}
    </Box>
);

export default OptionGrid;
