import {Theme} from '@mui/material/styles';

// Palette tokens shared by the theme (App.tsx) and the few components that need them directly.
// User card colors are not here: they come from stringToColor and must stay as they are.
export const GRADIENT_END = '#9b6cf6';

export const primaryGradient = (theme: Theme) =>
    `linear-gradient(90deg, ${theme.palette.primary.main}, ${GRADIENT_END})`;
