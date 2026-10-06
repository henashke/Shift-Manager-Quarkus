import React, {useState} from 'react';
import {observer} from 'mobx-react-lite';
import {useNavigate} from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import {keyframes, SxProps, Theme} from '@mui/material/styles';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import config from '../config';
import authStore from '../stores/AuthStore';
import DialogTextField from './dialogs/DialogTextField';
import {EASE_SETTLE, primaryGradient} from '../theme';

type Mode = 'login' | 'signup';

// The macOS password-field shake: a few quick swings that die down, saying "no" without a word
const shakeFrames = `
    0%, 100% {
        transform: none;
    }
    15% {
        transform: translateX(-10px);
    }
    30% {
        transform: translateX(8px);
    }
    45% {
        transform: translateX(-6px);
    }
    60% {
        transform: translateX(4px);
    }
    75% {
        transform: translateX(-2px);
    }
`;
const shake = keyframes(shakeFrames);

// The same motion under a second name (emotion names keyframes by content, hence the tiny change): switching between them restarts the shake on every failure
const shakeAgain = keyframes(shakeFrames.replace('transform: none', 'transform: translateX(0)'));

const rise = keyframes`
    from {
        opacity: 0;
        transform: translateY(12px);
    }
    to {
        opacity: 1;
        transform: none;
    }
`;

const cardSx = (failures: number): SxProps<Theme> => ({
    width: '100%',
    p: {xs: 2.5, sm: 3},
    borderRadius: 4,
    border: '1px solid',
    borderColor: 'divider',
    backgroundImage: 'none',
    animation: failures > 0
        ? `${failures % 2 ? shake : shakeAgain} 420ms ease-out`
        : `${rise} 500ms ${EASE_SETTLE} 80ms both`,
    '@media (prefers-reduced-motion: reduce)': {animation: 'none'},
});

// The same segmented control as the top bar's tabs
const segmentedSx: SxProps<Theme> = {
    minHeight: 0,
    p: 0.5,
    mb: 2.5,
    borderRadius: 3,
    bgcolor: 'action.hover',
    '& .MuiTabs-indicator': {height: '100%', borderRadius: 2, zIndex: 0, background: primaryGradient},
    '& .MuiTabs-flexContainer': {gap: 0.5},
};

const segmentSx: SxProps<Theme> = {
    zIndex: 1,
    flex: 1,
    minHeight: 0,
    py: 0.9,
    fontWeight: 600,
    color: 'text.secondary',
    '&.Mui-selected': {color: 'common.white'},
};

const iconSx: SxProps<Theme> = {
    width: 76,
    height: 76,
    borderRadius: '22px',
    boxShadow: '0 12px 32px rgba(0, 120, 255, 0.35)',
    animation: `${rise} 500ms ${EASE_SETTLE} both`,
    '@media (prefers-reduced-motion: reduce)': {animation: 'none'},
};

const postCredentials = async (path: string, name: string, password: string) => {
    const res = await fetch(`${config.API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, password}),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('שם המשתמש או הסיסמה שגויים');
    if (!res.ok) throw new Error(data.error || data.message || 'משהו השתבש, נסו שוב');
    return data;
};

const LoginSignup: React.FC = observer(() => {
    const [mode, setMode] = useState<Mode>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    // Counts failures, so the card shakes again even when the error text is the same
    const [failures, setFailures] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleModeChange = (_: React.SyntheticEvent, newMode: Mode) => {
        setMode(newMode);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // A new account signs straight in, instead of asking for the same details again
            if (mode === 'signup') await postCredentials('/auth/signup', username, password);
            const data = await postCredentials('/auth/login', username, password);
            if (!data.token || !data.username || !data.role) throw new Error('Invalid login response');
            authStore.setAuth(data.username, data.token, data.role, data.refreshToken);
            navigate('/');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message);
            setFailures(count => count + 1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box dir="rtl" sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 400,
            mx: 'auto',
            px: 2,
            pt: {xs: 3, sm: 8},
            pb: 4,
        }}>
            <Box component="img" src="/ko-2.png" alt="" sx={iconSx}/>
            <Typography component="h1" sx={{mt: 2, fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em'}}>
                כוננים
            </Typography>
            <Typography color="text.secondary" sx={{mb: 3}}>
                {mode === 'login' ? 'התחברו כדי לראות את השיבוצים' : 'פותחים חשבון ונכנסים מיד'}
            </Typography>
            <Paper elevation={0} sx={cardSx(failures)}>
                <Tabs value={mode} onChange={handleModeChange} variant="fullWidth" sx={segmentedSx}>
                    {/* Laid out left to right (no RTL style plugin), so listed in reverse to read right to left */}
                    <Tab value="signup" label="הרשמה" sx={segmentSx}/>
                    <Tab value="login" label="התחברות" sx={segmentSx}/>
                </Tabs>
                <Box component="form" onSubmit={handleSubmit} sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                    <DialogTextField label="שם משתמש" value={username} autoFocus required
                                     autoComplete="username" autoCapitalize="none"
                                     onChange={e => setUsername(e.target.value)}/>
                    <DialogTextField label="סיסמה" type={showPassword ? 'text' : 'password'} value={password} required
                                     autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                     onChange={e => setPassword(e.target.value)}
                                     slotProps={{
                                         input: {
                                             endAdornment: (
                                                 <InputAdornment position="end">
                                                     <IconButton size="small" edge="end"
                                                                 aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                                                                 onClick={() => setShowPassword(!showPassword)}>
                                                         {showPassword ? <VisibilityOffOutlined fontSize="small"/>
                                                             : <VisibilityOutlined fontSize="small"/>}
                                                     </IconButton>
                                                 </InputAdornment>
                                             ),
                                         },
                                     }}/>
                    {error ? <Alert severity="error" sx={{borderRadius: 2.5}}>{error}</Alert> : null}
                    <Button type="submit" variant="contained" fullWidth disabled={loading} aria-busy={loading}
                            sx={{py: 1.25, fontSize: '1rem', '&.Mui-disabled': {background: primaryGradient, color: 'common.white', opacity: 0.85}}}>
                        {loading ? <CircularProgress size={22} color="inherit"/> : mode === 'login' ? 'התחבר' : 'הירשם והתחבר'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
});

export default LoginSignup;
