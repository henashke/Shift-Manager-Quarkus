import React, {useEffect, useMemo, useState} from 'react';
import NotificationDisplay from './components/NotificationDisplay';
import {CssBaseline} from '@mui/material';
import {observer} from 'mobx-react-lite';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {Route, Routes, useNavigate} from 'react-router-dom';
import LoginSignup from './components/LoginSignup';
import authStore from './stores/AuthStore';
import ConstraintTab from './components/tabs/ConstraintTab';
import AssignmentTab from './components/tabs/AssignmentTab';
import SettingsTab from './components/tabs/SettingsTab';
import {AppBarComponent} from "./components/AppBarComponent";
import {primaryGradient} from './theme';

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
        typography: {
            fontFamily: [
                'Inter',
                'Segoe UI',
                'Arial',
                'sans-serif',
            ].join(','),
        },
        components: {
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
                <Route path="/" element={<AssignmentTab/>}/>
            </Routes>
            <NotificationDisplay/>
        </ThemeProvider>
    );
});

export default App;
