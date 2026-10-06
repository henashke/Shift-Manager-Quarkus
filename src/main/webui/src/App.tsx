import React, {useEffect, useMemo, useState} from 'react';
import NotificationDisplay from './components/NotificationDisplay';
import {CssBaseline} from '@mui/material';
import {observer} from 'mobx-react-lite';
import {alpha, createTheme, ThemeProvider} from '@mui/material/styles';
import {Route, Routes, useNavigate} from 'react-router-dom';
import LoginSignup from './components/LoginSignup';
import authStore from './stores/AuthStore';
import ConstraintTab from './components/tabs/ConstraintTab';
import AssignmentTab from './components/tabs/AssignmentTab';
import SettingsTab from './components/tabs/SettingsTab';
import StatsTab from './components/tabs/StatsTab';
import {AppBarComponent} from "./components/AppBarComponent";
import AnnouncementDialog from "./components/dialogs/AnnouncementDialog";
import {EASE_SETTLE, glass, pressable, primaryGradient} from './theme';

const DARK_MODE_KEY = 'darkMode';

const App: React.FC = observer(() => {
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem(DARK_MODE_KEY);
        return savedMode ? JSON.parse(savedMode) : true;
    });

    useEffect(() => {
        localStorage.setItem(DARK_MODE_KEY, JSON.stringify(darkMode));
    }, [darkMode]);

    useEffect(() => {
        authStore.ensureValidSession(navigate);
        if (!authStore.isAuthenticated() && window.location.pathname !== '/login') {
            navigate('/login');
        } else if (authStore.isAuthenticated() && window.location.pathname === '/login') {
            navigate('/');
        }
    }, [navigate]);

    // Memoized: App re-renders on every route change (useNavigate), and a new theme restyles the whole tree
    const theme = useMemo(() => createTheme({
        // Ink with a faint violet cast; surfaces sit lighter than the page. secondary (pending cards) and
        // error/warning/success (constraint cards, danger buttons) keep MUI's defaults on purpose.
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: '#6d5ef5',
            },
            background: {
                default: darkMode ? '#16161d' : '#f4f4f8',
                paper: darkMode ? '#1f1f29' : '#ffffff',
            },
            text: darkMode
                ? {primary: '#ecebf5', secondary: '#a09fb3'}
                : {primary: '#1b1a26', secondary: '#5f5e72'},
            divider: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(20, 20, 40, 0.09)',
        },
        direction: 'rtl',
        // Rubik (bundled, see index.tsx) covers Hebrew and Latin, and its soft corners match the rounded UI
        typography: {
            fontFamily: [
                '"Rubik Variable"',
                '"Segoe UI"',
                'Arial',
                'sans-serif',
            ].join(','),
            // Tracking tightens as type grows; body text stays at 0
            h4: {letterSpacing: '-0.02em'},
            h5: {letterSpacing: '-0.015em'},
            h6: {letterSpacing: '-0.01em'},
        },
        components: {
            // No Material ripple: controls answer a press by scaling down instantly (see pressable), and keyboard focus
            // gets a ring instead
            MuiButtonBase: {
                defaultProps: {disableRipple: true},
                styleOverrides: {
                    root: ({theme}) => ({
                        '&.Mui-focusVisible': {outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2},
                    }),
                },
            },
            MuiIconButton: {
                styleOverrides: {root: pressable(0.9)},
            },
            MuiTab: {
                styleOverrides: {
                    root: {
                        transition: 'color 200ms, opacity 150ms',
                        '&:active': {opacity: 0.6, transitionDuration: '0ms'},
                    },
                },
            },
            MuiTooltip: {
                styleOverrides: {
                    tooltip: ({theme}) => ({
                        ...glass(theme, 0.85),
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        padding: '6px 10px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                    }),
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: ({theme}) => ({
                        borderRadius: 10,
                        transition: `box-shadow 200ms ${EASE_SETTLE}`,
                        // A soft halo around the focused field, on top of MUI's border color
                        '&.Mui-focused': {boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.18)}`},
                        '&.Mui-error.Mui-focused': {boxShadow: `0 0 0 4px ${alpha(theme.palette.error.main, 0.18)}`},
                    }),
                },
            },
            // Drop MUI's dark-mode elevation overlay so every surface is the same paper color
            MuiPaper: {
                styleOverrides: {root: {backgroundImage: 'none'}},
            },
            // The app's one button language; pages shouldn't restyle buttons themselves
            MuiButton: {
                defaultProps: {disableElevation: true},
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        fontWeight: 700,
                        textTransform: 'none',
                        // MUI's icon margins don't flip without an RTL style plugin, so space icons with gap
                        gap: 8,
                        '& .MuiButton-startIcon, & .MuiButton-endIcon': {margin: 0},
                        ...pressable(0.97),
                    },
                },
                variants: [
                    {
                        props: {variant: 'contained', color: 'primary'},
                        style: ({theme}) => ({
                            background: primaryGradient(theme),
                            '&.Mui-disabled': {background: theme.palette.action.disabledBackground},
                        }),
                    },
                    {
                        props: {variant: 'outlined', color: 'inherit'},
                        style: ({theme}) => ({borderColor: theme.palette.divider}),
                    },
                ],
            },
            // Context menus share the dialogs' surface; they render in a portal, so set RTL here
            MuiMenu: {
                styleOverrides: {
                    // Translucent, like a context menu floating over the page; it grows out of what was tapped
                    paper: ({theme}) => ({
                        direction: 'rtl',
                        minWidth: 180,
                        borderRadius: 14,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundImage: 'none',
                        ...glass(theme),
                        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
                    }),
                    list: {padding: 4},
                },
            },
            MuiMenuItem: {
                styleOverrides: {
                    root: ({theme}) => ({
                        gap: 12,
                        minHeight: 0,
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        transition: 'background-color 150ms',
                        // Highlights the moment it's touched, not after release
                        '&:active': {backgroundColor: theme.palette.action.selected, transitionDuration: '0ms'},
                        // Inside a menu, keyboard focus is a highlighted row rather than a ring
                        '&.Mui-focusVisible': {outline: 'none', backgroundColor: theme.palette.action.focus},
                        '& .MuiListItemIcon-root': {minWidth: 0, color: theme.palette.text.secondary},
                    }),
                },
            },
        },
    }), [darkMode]);
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <AppBarComponent darkMode={darkMode} setDarkMode={setDarkMode}/>
            <Routes>
                <Route path="/login" element={<LoginSignup/>}/>
                <Route path="/constraints" element={<ConstraintTab/>}/>
                <Route path="/settings" element={<SettingsTab/>}/>
                <Route path="/stats" element={<StatsTab/>}/>
                <Route path="/" element={<AssignmentTab/>}/>
            </Routes>
            <NotificationDisplay/>
            <AnnouncementDialog/>
        </ThemeProvider>
    );
});

export default App;
