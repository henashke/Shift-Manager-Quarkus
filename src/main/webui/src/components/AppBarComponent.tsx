import React, {startTransition, useState} from 'react';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import {SxProps, Theme} from '@mui/material/styles';
import DarkMode from '@mui/icons-material/DarkMode';
import LightMode from '@mui/icons-material/LightMode';
import LoginIcon from '@mui/icons-material/Login';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';
import {observer} from 'mobx-react-lite';
import {dangerMenuItemSx} from './basicSharedComponents/menuStyles';
import {useNavigate} from 'react-router-dom';
import authStore from "../stores/AuthStore";
import LogoutDialog from "./dialogs/LogoutDialog";
import AccountDialog from "./dialogs/AccountDialog";
import {stringToColor} from "./shiftTable/ShiftTable";
import {primaryGradient} from '../theme';

const appBarSx: SxProps<Theme> = {
    mb: 2,
    bgcolor: 'background.default',
    backgroundImage: 'none',
    boxShadow: 'none',
    borderBottom: '1px solid',
    borderColor: 'divider',
};

const squareButtonSx: SxProps<Theme> = {
    width: 36,
    height: 36,
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
};

// A segmented control: the indicator is stretched into a pill behind the selected tab, so it still slides on change
const tabsSx: SxProps<Theme> = {
    minHeight: 0,
    p: 0.5,
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    '& .MuiTabs-indicator': {
        height: '100%',
        borderRadius: 2,
        zIndex: 0,
        background: primaryGradient,
    },
};

const tabSx: SxProps<Theme> = {
    zIndex: 1,
    minHeight: 0,
    minWidth: 0,
    // Narrower on phones, so four tabs fit between the theme toggle and the avatar
    px: {xs: 1.25, sm: 2},
    py: 0.75,
    fontSize: {xs: '0.85rem', sm: '0.875rem'},
    fontWeight: 600,
    color: 'text.secondary',
    '&.Mui-selected': {color: 'common.white'},
};

// An observer, so the avatar follows a rename
export const AppBarComponent = observer(({darkMode, setDarkMode}: {
    darkMode: boolean,
    setDarkMode: (isDarkMode: boolean) => void
}) => {
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(() => {
        if (window.location.pathname.startsWith('/constraints')) return 1;
        if (window.location.pathname.startsWith('/stats')) return 2;
        if (window.location.pathname.startsWith('/settings')) return 3;
        return 0;
    });
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);


    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        // Mount the new tab as a transition so the indicator animation isn't blocked by it
        startTransition(() => {
            if (newValue === 0) navigate('/');
            if (newValue === 1) navigate('/constraints');
            if (newValue === 2) navigate('/stats');
            if (newValue === 3) navigate('/settings');
        });
    };

    return <AppBar position="sticky" color="inherit" sx={appBarSx}>
        <Toolbar variant="dense" sx={{gap: 1, minHeight: 56, px: {xs: 1.5, sm: 2}}}>
            <IconButton aria-label="החלף ערכת צבעים" onClick={() => setDarkMode(!darkMode)} sx={squareButtonSx}>
                {darkMode ? <LightMode fontSize="small" sx={{color: '#ffe066'}}/> : <DarkMode fontSize="small"/>}
            </IconButton>
            <Box sx={{flex: 1, display: 'flex', justifyContent: 'center'}}>
                <Tabs value={tabValue} onChange={handleTabChange} sx={tabsSx}>
                    {/* Laid out left to right (no RTL style plugin), so listed in reverse to read right to left */}
                    <Tab value={3} label="הגדרות" sx={tabSx}/>
                    <Tab value={2} label="נתונים" sx={tabSx}/>
                    <Tab value={1} label="אילוצים" sx={tabSx}/>
                    <Tab value={0} label="שיבוצים" sx={tabSx}/>
                </Tabs>
            </Box>
            {authStore.isAuthenticated() ? (
                <>
                    {authStore.username ? (
                        <Tooltip title="אפשרויות משתמש">
                            <IconButton aria-label="אפשרויות משתמש" onClick={e => setAnchorEl(e.currentTarget)}
                                        sx={{p: 0, borderRadius: 2}}>
                                <Avatar variant="rounded" sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 2,
                                    bgcolor: stringToColor(authStore.username),
                                    color: 'common.white',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                }}>
                                    {authStore.username[0].toUpperCase()}
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                    ) : null}
                    <Menu
                        anchorEl={anchorEl}
                        open={menuOpen}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                        transformOrigin={{vertical: 'top', horizontal: 'right'}}
                    >
                        <MenuItem onClick={() => {
                            setAnchorEl(null);
                            setAccountOpen(true);
                        }}>
                            <ListItemIcon><ManageAccountsOutlined fontSize="small"/></ListItemIcon>
                            החשבון שלי
                        </MenuItem>
                        <MenuItem sx={dangerMenuItemSx} onClick={() => {
                            setAnchorEl(null);
                            setLogoutOpen(true);
                        }}>
                            <ListItemIcon><LogoutRounded fontSize="small"/></ListItemIcon>
                            יציאה
                        </MenuItem>
                    </Menu>
                </>
            ) : (
                <IconButton aria-label="התחברות" onClick={() => navigate('/login')} sx={squareButtonSx}>
                    <LoginIcon fontSize="small"/>
                </IconButton>
            )}
            <LogoutDialog
                open={logoutOpen}
                onClose={() => setLogoutOpen(false)}
                onLogout={() => {
                    authStore.logout();
                    setLogoutOpen(false);
                }}
                username={authStore.username || ''}
            />
            <AccountDialog open={accountOpen} handleDialogClose={() => setAccountOpen(false)}/>
        </Toolbar>
    </AppBar>
});
