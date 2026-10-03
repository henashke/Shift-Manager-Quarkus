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

const DARK_MODE_KEY = 'darkMode';
// The second stop of the primary button gradient
const GRADIENT_END = '#8b5cf6';

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
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: '#594db9',
            },
            background: {
                default: darkMode ? '#252529' : '#f5f5f5',
                paper: darkMode ? 'rgb(32,32,36)' : '#fff',
            },
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
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${GRADIENT_END})`,
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
                    paper: ({theme}) => ({
                        direction: 'rtl',
                        minWidth: 180,
                        borderRadius: 12,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundImage: 'none',
                        boxShadow: '0 16px 32px rgba(0, 0, 0, 0.3)',
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
                <Route path="/" element={<AssignmentTab/>}/>
            </Routes>
            <NotificationDisplay/>
        </ThemeProvider>
    );
});

export default App;
