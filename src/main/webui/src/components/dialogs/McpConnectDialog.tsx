import React, {useState} from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {SxProps, Theme} from '@mui/material/styles';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import SmartToyOutlined from '@mui/icons-material/SmartToyOutlined';
import CommonDialog from './CommonDialog';
import notificationStore from '../../stores/NotificationStore';
import authStore from '../../stores/AuthStore';
import {segmentedSx, segmentSx} from '../../theme';

// How to connect a chat app (Claude, ChatGPT, Gemini) to the MCP server at /mcp. The app signs in through the connect
// page (ConnectApp) once; after that the user can ask about shifts in any new chat.

type App = 'claude' | 'chatgpt' | 'gemini';

// Navigation state that opens this dialog when arriving at the settings page (from the feature's announcement)
export const OPEN_CONNECT_STATE = {openConnect: true};
export const isOpenConnectState = (state: unknown) =>
    (state as typeof OPEN_CONNECT_STATE | null)?.openConnect === true;

// Menu names are the apps' own (English) labels, so users can find them; they change now and then, hence the note
const steps: Record<App, { steps: React.ReactNode[], note: string }> = {
    claude: {
        steps: [
            <>בהגדרות של Claude (באתר או באפליקציה), פתחו את <b>Connectors</b>.</>,
            <>לחצו על <b>Add custom connector</b>, תנו לו שם (למשל "כוננים") והדביקו את הכתובת.</>,
            <>לחצו על <b>Connect</b>, התחברו עם שם המשתמש והסיסמה של כוננים ואשרו.</>,
            <>בצ'אט חדש, ודאו שהמחבר פעיל בתפריט הכלים, ושאלו.</>,
        ],
        note: 'ייתכן שמחברים מותאמים דורשים מנוי בתשלום.',
    },
    chatgpt: {
        steps: [
            <>בהגדרות של ChatGPT, פתחו את <b>Apps & Connectors</b>, ואז את <b>Advanced settings</b>, והפעילו את <b>Developer mode</b>.</>,
            <>לחצו על <b>Create</b>, תנו שם, הדביקו את הכתובת ובחרו <b>OAuth</b> כשיטת האימות.</>,
            <>התחברו עם שם המשתמש והסיסמה של כוננים ואשרו.</>,
            <>בצ'אט חדש, בחרו את המחבר מתפריט ה־<b>+</b> ושאלו.</>,
        ],
        note: 'נדרש מנוי בתשלום. שמות התפריטים עשויים להשתנות.',
    },
    gemini: {
        steps: [
            <>בהגדרות של Gemini, פתחו את <b>Connected apps</b> והוסיפו אפליקציה מותאמת.</>,
            <>הדביקו את הכתובת.</>,
            <>התחברו עם שם המשתמש והסיסמה של כוננים ואשרו.</>,
            <>בצ'אט חדש, שאלו.</>,
        ],
        note: 'האפשרות להוסיף אפליקציות מותאמות זמינה רק בחלק מהחשבונות של Gemini. אם היא לא מופיעה אצלכם, השתמשו ב־Claude או ב־ChatGPT.',
    },
};

// Also shown in the announcement of this feature (announcements.tsx). The calendar one works when the chat app has a
// calendar connected too.
export const mcpExamples = [
    'מתי יש לי משמרות בשבוע הבא?',
    'מי הכונן הלילה?',
    'תכניס את כל המשמרות שלי של שבוע הבא ליומן',
    'אני לא יכול ביום שלישי בלילה, תעדכן אילוץ',
];
const adminExamples = ['מי עוד לא שובץ בשבוע הבא?', 'תחליף בין יוסי לדנה ביום רביעי'];

const labelSx: SxProps<Theme> = {display: 'block', fontWeight: 600, fontSize: '0.9rem', mb: 0.75};

const addressSx: SxProps<Theme> = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    // The copy button sits at the start (right)
    paddingInlineStart: 0.5,
    paddingInlineEnd: 1.5,
    py: 0.5,
    borderRadius: 2.5,
    bgcolor: 'action.hover',
    border: '1px solid',
    borderColor: 'divider',
};

const addressTextSx: SxProps<Theme> = {
    flex: 1,
    minWidth: 0,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '0.85rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    userSelect: 'all',
};

const stepsSx: SxProps<Theme> = {
    m: 0,
    paddingInlineStart: 2.5,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    '& li': {lineHeight: 1.6, fontSize: '0.9rem'},
    '& li::marker': {color: 'primary.light', fontWeight: 700},
    // English menu names: kept whole and in their own direction inside the Hebrew sentence
    '& b': {whiteSpace: 'nowrap', unicodeBidi: 'isolate'},
};

const examplesSx: SxProps<Theme> = {display: 'flex', flexWrap: 'wrap', gap: 0.75};

const exampleSx: SxProps<Theme> = {
    px: 1.25,
    py: 0.5,
    borderRadius: 2,
    fontSize: '0.85rem',
    bgcolor: 'action.hover',
    border: '1px solid',
    borderColor: 'divider',
};

const McpConnectDialog: React.FC<{ open: boolean, onClose: () => void }> = ({open, onClose}) => {
    const [app, setApp] = useState<App>('claude');
    const address = `${window.location.origin}/mcp`;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(address);
            notificationStore.showSuccess('הכתובת הועתקה');
        } catch (e) {
            notificationStore.showError('ההעתקה נכשלה, סמנו את הכתובת והעתיקו ידנית');
        }
    };

    const content = (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2.5}}>
            <Box>
                <Typography component="span" sx={labelSx}>כתובת החיבור</Typography>
                <Box sx={addressSx}>
                    <Tooltip title="העתק">
                        <IconButton size="small" aria-label="העתק את הכתובת" onClick={copy}>
                            <ContentCopyRounded fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                    <Typography dir="ltr" sx={addressTextSx}>{address}</Typography>
                </Box>
            </Box>

            <Box>
                <Tabs value={app} onChange={(_, value: App) => setApp(value)} variant="fullWidth" sx={segmentedSx}>
                    {/* The dialog is dir="rtl", so these run right to left */}
                    <Tab value="claude" label="Claude" sx={segmentSx}/>
                    <Tab value="chatgpt" label="ChatGPT" sx={segmentSx}/>
                    <Tab value="gemini" label="Gemini" sx={segmentSx}/>
                </Tabs>
                <Box component="ol" sx={{...stepsSx, mt: 2} as SxProps<Theme>}>
                    {steps[app].steps.map((step, i) => <li key={i}>{step}</li>)}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1.5}}>
                    {steps[app].note}
                </Typography>
            </Box>

            <Box>
                <Typography component="span" sx={labelSx}>דוגמאות לשאלות</Typography>
                <Box sx={examplesSx}>
                    {(authStore.isAdmin() ? [...mcpExamples, ...adminExamples] : mcpExamples).map(example => (
                        <Box key={example} sx={exampleSx}>{example}</Box>
                    ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1}}>
                    כדי להכניס משמרות ליומן, חברו לאותה אפליקציה גם את היומן שלכם (למשל Google Calendar).
                </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary">
                העוזר פועל בשמכם, ויכול לראות ולשנות רק את מה שאתם יכולים. מתחברים פעם אחת, ואחר כך זה עובד בכל צ'אט חדש.
                כדי לנתק, הסירו את המחבר מהאפליקציה. החלפת סיסמה מנתקת את כל המחברים.
            </Typography>
        </Box>
    );

    return (
        <CommonDialog open={open} handleDialogClose={onClose} icon={<SmartToyOutlined/>}
                      title="חיבור לעוזר AI"
                      description="שאלו על המשמרות שלכם ישירות מהצ'אט, ב־Claude, ב־ChatGPT או ב־Gemini."
                      content={content}/>
    );
};

export default McpConnectDialog;
