import React, {useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import {useSearchParams} from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import {keyframes, SxProps, Theme} from '@mui/material/styles';
import config from '../config';
import authStore from '../stores/AuthStore';
import DialogTextField from './dialogs/DialogTextField';
import {EASE_SETTLE, primaryGradient} from '../theme';

// Where a chat app (Claude, ChatGPT, Gemini...) sends the user to connect to the MCP server: the OAuth authorization
// page. The server's /oauth/authorize forwards here with the app's parameters; approving sends the browser back to the
// app with a one-time code.

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

const cardSx: SxProps<Theme> = {
    width: '100%',
    p: {xs: 2.5, sm: 3},
    borderRadius: 4,
    border: '1px solid',
    borderColor: 'divider',
    backgroundImage: 'none',
    animation: `${rise} 500ms ${EASE_SETTLE} 80ms both`,
    '@media (prefers-reduced-motion: reduce)': {animation: 'none'},
};

const iconSx: SxProps<Theme> = {
    width: 76,
    height: 76,
    borderRadius: '22px',
    boxShadow: '0 12px 32px rgba(0, 120, 255, 0.35)',
};

type ClientInfo = { name: string | null, redirectHost: string };

const ConnectApp: React.FC = observer(() => {
    const [params] = useSearchParams();
    const clientId = params.get('client_id') ?? '';
    const redirectUri = params.get('redirect_uri') ?? '';

    const [client, setClient] = useState<ClientInfo | null>(null);
    const [loadError, setLoadError] = useState('');
    // Signed in to the web app already: approve as that user, unless they choose another account
    const [useOtherAccount, setUseOtherAccount] = useState(!authStore.isAuthenticated());
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const query = new URLSearchParams({client_id: clientId, redirect_uri: redirectUri});
        fetch(`${config.API_BASE_URL}/oauth/client?${query}`)
            .then(async res => {
                const body = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(body.error || 'הבקשה לא תקינה');
                setClient(body);
            })
            .catch(err => setLoadError(err.message));
    }, [clientId, redirectUri]);

    const appName = client?.name || client?.redirectHost || 'האפליקציה';

    const answer = async (approve: boolean) => {
        setError('');
        setBusy(true);
        try {
            const withCredentials = approve && useOtherAccount;
            const headers: Record<string, string> = {'Content-Type': 'application/json'};
            if (approve && !withCredentials) {
                if (!(await authStore.ensureFreshToken())) {
                    setUseOtherAccount(true);
                    throw new Error('החיבור פג, התחברו שוב');
                }
                Object.assign(headers, authStore.getAuthHeaders());
            }
            const res = await fetch(`${config.API_BASE_URL}/oauth/authorize`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    clientId,
                    redirectUri,
                    responseType: params.get('response_type'),
                    codeChallenge: params.get('code_challenge'),
                    codeChallengeMethod: params.get('code_challenge_method'),
                    state: params.get('state'),
                    approve,
                    ...(withCredentials ? {username, password} : {}),
                }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.error || 'משהו השתבש, נסו שוב');
            window.location.assign(body.redirectUrl);
        } catch (err: any) {
            setError(err.message);
            setBusy(false);
        }
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        answer(true);
    };

    return (
        <Box dir="rtl" sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 420,
            mx: 'auto',
            px: 2,
            pt: {xs: 3, sm: 8},
            pb: 4,
        }}>
            <Box component="img" src="/ko-2.png" alt="" sx={iconSx}/>
            <Typography component="h1" sx={{mt: 2, mb: 3, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center'}}>
                חיבור לכוננים
            </Typography>
            <Paper elevation={0} sx={cardSx}>
                {loadError ? <Alert severity="error" sx={{borderRadius: 2.5}}>{loadError}</Alert> : !client ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress/></Box>
                ) : (
                    <Box component="form" onSubmit={onSubmit} sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        <Box>
                            <Typography sx={{fontWeight: 700, fontSize: '1.1rem'}}>{appName}</Typography>
                            <Typography variant="body2" color="text.secondary" dir="ltr" sx={{textAlign: 'right'}}>
                                {client.redirectHost}
                            </Typography>
                        </Box>
                        <Typography variant="body2">
                            מבקש/ת גישה לחשבון שלך: לראות את השיבוצים, האילוצים והנתונים, ולעדכן את האילוצים שלך.
                            {' '}למנהלים: גם לשבץ ולערוך את לוח השיבוצים.
                            {' '}אשרו רק אם התחלתם את החיבור בעצמכם.
                        </Typography>
                        {useOtherAccount ? (
                            <>
                                <DialogTextField label="שם משתמש" value={username} required autoFocus
                                                 autoComplete="username" autoCapitalize="none"
                                                 onChange={e => setUsername(e.target.value)}/>
                                <DialogTextField label="סיסמה" type="password" value={password} required
                                                 autoComplete="current-password"
                                                 onChange={e => setPassword(e.target.value)}/>
                            </>
                        ) : (
                            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1}}>
                                <Typography variant="body2">
                                    מחובר/ת בתור <b>{authStore.username}</b>
                                </Typography>
                                <Button size="small" color="inherit" onClick={() => setUseOtherAccount(true)}>
                                    משתמש אחר
                                </Button>
                            </Box>
                        )}
                        {error ? <Alert severity="error" sx={{borderRadius: 2.5}}>{error}</Alert> : null}
                        <Box sx={{display: 'flex', gap: 1}}>
                            <Button type="submit" variant="contained" disabled={busy} aria-busy={busy}
                                    sx={{flex: 2, py: 1.1, '&.Mui-disabled': {background: primaryGradient, color: 'common.white', opacity: 0.85}}}>
                                {busy ? <CircularProgress size={22} color="inherit"/> : 'חבר את החשבון'}
                            </Button>
                            <Button variant="outlined" color="inherit" disabled={busy} onClick={() => answer(false)} sx={{flex: 1}}>
                                בטל
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
});

export default ConnectApp;
