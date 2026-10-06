import {alpha, Theme} from '@mui/material/styles';

// Palette tokens shared by the theme (App.tsx) and the few components that need them directly.
// User card colors are not here: they come from stringToColor and must stay as they are.
export const GRADIENT_END = '#9b6cf6';

export const primaryGradient = (theme: Theme) =>
    `linear-gradient(90deg, ${theme.palette.primary.main}, ${GRADIENT_END})`;

// Motion. One curve for things settling into place (close to a critically damped spring), a quicker ease-in for things
// leaving, and an instant press, so feedback lands on touch-down rather than on release.
export const EASE_SETTLE = 'cubic-bezier(0.2, 0.9, 0.3, 1)';
export const EASE_EXIT = 'cubic-bezier(0.4, 0, 1, 1)';
// Sheets and toasts: the curve iOS uses for presenting sheets
export const EASE_SHEET = 'cubic-bezier(0.32, 0.72, 0, 1)';
export const PRESS_MS = 80;
export const RELEASE_MS = 220;

// Scales a control down while it's pressed and springs it back on release
export const pressable = (scale: number) => ({
    transition: `transform ${RELEASE_MS}ms ${EASE_SETTLE}, background-color 150ms, border-color 150ms, color 150ms, opacity 150ms`,
    '&:active:not(.Mui-disabled)': {
        transform: `scale(${scale})`,
        transitionDuration: `${PRESS_MS}ms`,
    },
    '@media (prefers-reduced-motion: reduce)': {
        '&:active:not(.Mui-disabled)': {transform: 'none', opacity: 0.7},
    },
});

// A translucent surface floating above the page (menus, the top bar, toasts): the content behind shows through
// blurred. Solid when the user asks for less transparency.
export const glass = (theme: Theme, opacity = 0.72, color = theme.palette.background.paper) => ({
    backgroundColor: alpha(color, opacity),
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    '@media (prefers-reduced-transparency: reduce)': {
        backgroundColor: color,
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
    },
});

// The toast's surface, shared by everything that floats over the page the same way (the compact date pill, the users
// tray, the unsaved-changes bar): glass, a hairline border and a soft, wide shadow. `shadowY` flips the shadow upward
// for surfaces anchored to the bottom of the screen.
export const floatingSurface = (theme: Theme, shadowY = 12) => ({
    ...glass(theme, 0.8),
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: `0 ${shadowY}px 36px rgba(0, 0, 0, 0.28)`,
});
