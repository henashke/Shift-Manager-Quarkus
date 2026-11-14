import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NewReleasesOutlined from '@mui/icons-material/NewReleasesOutlined';
import SmartToyOutlined from '@mui/icons-material/SmartToyOutlined';
import TableChartOutlined from '@mui/icons-material/TableChartOutlined';
import UserCard from './components/basicSharedComponents/UserCard';
import {calendarButtonSx, CalendarPlusIcon} from './components/shiftTable/AddToCalendarButton';
import {mcpExamples, OPEN_CONNECT_STATE} from './components/dialogs/McpConnectDialog';
import {alpha, Theme} from '@mui/material/styles';
import {primaryGradient} from './theme';

/**
 * "What's new" announcements, each popping up once per device (seen ids are kept in localStorage), only during the
 * AUTO_SHOW_DAYS after its date. Only one pops up per visit: the oldest one not seen yet, so keep the list in the order
 * the features shipped. All of them can be browsed any time from settings ("פיצ׳רים חדשים"). To announce a feature, add
 * an entry at the end with a new, never reused id and the day it ships.
 */
export interface Announcement {
    id: string;
    title: string;
    // One line under the title
    description?: string;
    icon?: React.ReactNode;
    // Defaults to everyone
    audience?: 'all' | 'admin';
    // When the feature shipped (yyyy-mm-dd). It pops up only for AUTO_SHOW_DAYS after that, so people who join much
    // later don't get stale news; settings still lists it
    date: string;
    confirmLabel?: string;
    // A button that takes the user to the feature (then a cancel button, "אחר כך", dismisses it instead)
    action?: { label: string, path: string, state?: unknown };
    content: (isAdmin: boolean) => React.ReactNode;
}

const previewSx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0.75,
    py: 2,
    mb: 2,
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'action.hover',
} as const;

const pointsSx = {
    m: 0,
    paddingInlineStart: 2.5,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    // Names with Latin words (a settings row) stay whole and keep the sentence's punctuation in place
    '& b': {whiteSpace: 'nowrap', unicodeBidi: 'isolate'},
} as const;

// A still copy of the week's table sub-tabs (ShiftTableTabs), with the extra table selected
const sampleTabsSx = {
    display: 'flex',
    gap: 0.5,
    p: 0.5,
    borderRadius: 2.5,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
} as const;
const sampleTabSx = {px: 1.75, py: 0.5, borderRadius: 2, fontSize: '0.85rem', fontWeight: 600} as const;

// Questions as chat bubbles, the way they're typed in the chat app
const chatSx = {...previewSx, alignItems: 'stretch', px: 1.5} as const;
const bubbleSx = {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    px: 1.5,
    py: 0.75,
    borderRadius: 2.5,
    borderEndStartRadius: 0.75,
    fontSize: '0.85rem',
    color: 'common.white',
    background: primaryGradient,
} as const;

// A still copy of the shifts table's header corner with the calendar button, and the events it adds
const sampleHeaderSx = {display: 'flex', alignItems: 'center', gap: 3, mb: 0.5} as const;
const sampleCalendarButtonSx = {
    ...calendarButtonSx,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'primary.light',
    borderColor: 'primary.main',
} as const;
const sampleEventSx = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 2,
    width: 220,
    px: 1.5,
    py: 0.75,
    borderRadius: 2,
    fontSize: '0.85rem',
    borderInlineStart: '3px solid',
    borderColor: 'primary.main',
    bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.14),
} as const;

export const AUTO_SHOW_DAYS = 30;

// True while the announcement is less than AUTO_SHOW_DAYS old (counted in local days)
export const isRecent = (announcement: Announcement, now: Date = new Date()) => {
    const [y, m, d] = announcement.date.split('-').map(Number);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today.getTime() - new Date(y, m - 1, d).getTime()) / 86_400_000) < AUTO_SHOW_DAYS;
};

export const announcements: Announcement[] = [
    {
        id: 'shadow-and-jump-shifts',
        title: 'חדש: כונן צל וכונן הקפצה',
        description: 'לכל משמרת אפשר עכשיו לשבץ גם כונן צל וכונן הקפצה.',
        icon: <NewReleasesOutlined/>,
        date: '2026-10-06',
        content: isAdmin => (
            <>
                {/* A shift cell as it looks in the table */}
                <Box sx={previewSx} aria-hidden>
                    <UserCard name="דנה" subtitle="פלוס 60"/>
                    <UserCard name="יוסי" subtitle="כונן צל" secondary/>
                    <UserCard name="רוני" subtitle="כונן הקפצה" secondary/>
                </Box>
                <Box component="ul" sx={pointsSx}>
                    <Typography component="li" variant="body2">
                        הם מופיעים מתחת לכונן של המשמרת, בכרטיס קטן עם מסגרת.
                    </Typography>
                    {isAdmin ? (
                        <Typography component="li" variant="body2">
                            כדי לשבץ, לחצו על משמרת בטבלה ובחרו "הגדר כונן צל" או "הגדר כונן הקפצה".
                        </Typography>
                    ) : null}
                </Box>
            </>
        ),
    },
    {
        id: 'extra-shift-tables',
        title: 'חדש: טבלאות נוספות לשבוע',
        description: 'לשבוע יכולות להיות עכשיו טבלאות משמרות נוספות, לצד הטבלה הרגילה.',
        icon: <TableChartOutlined/>,
        date: '2026-10-06',
        content: isAdmin => (
            <>
                {/* The sub-tabs and a shift in the extra table, as they look on the shifts screen */}
                <Box sx={previewSx} aria-hidden>
                    <Box sx={sampleTabsSx}>
                        <Box sx={{...sampleTabSx, color: 'text.secondary'}}>רגיל</Box>
                        <Box sx={{...sampleTabSx, color: 'common.white', background: primaryGradient}}>משמרות זהב</Box>
                    </Box>
                    <UserCard name="דנה" subtitle="פלוס 60"/>
                </Box>
                <Box component="ul" sx={pointsSx}>
                    <Typography component="li" variant="body2">
                        בשבוע שיש בו טבלה נוספת, כמו "משמרות זהב", מופיעות לשוניות מתחת לניווט בין השבועות. עוברים ביניהן
                        בלחיצה.
                    </Typography>
                    {isAdmin ? (
                        <Typography component="li" variant="body2">
                            כדי ליצור טבלה, לחצו "צור טבלה נוספת לשבוע". כשהטבלה נבחרת אפשר לשנות את שמה או למחוק אותה.
                        </Typography>
                    ) : null}
                </Box>
            </>
        ),
    },
    {
        id: 'mcp-connect',
        title: 'חדש: שאלו על המשמרות מהצ\'אט',
        description: 'אפשר עכשיו לחבר את כוננים ל־Claude, ל־ChatGPT או ל־Gemini ולשאול שם על המשמרות.',
        icon: <SmartToyOutlined/>,
        date: '2026-11-14',
        action: {label: 'להוראות החיבור', path: '/settings', state: OPEN_CONNECT_STATE},
        content: () => (
            <>
                <Box sx={chatSx} aria-hidden>
                    {mcpExamples.map(example => <Box key={example} sx={bubbleSx}>{example}</Box>)}
                </Box>
                <Box component="ul" sx={pointsSx}>
                    <Typography component="li" variant="body2">
                        מתחברים פעם אחת, בהגדרות, בלחיצה על <b>חיבור לעוזר AI</b>. אחר כך שואלים בכל צ'אט חדש.
                    </Typography>
                    <Typography component="li" variant="body2">
                        העוזר פועל בשמכם, ויכול לראות ולשנות רק את מה שאתם יכולים.
                    </Typography>
                </Box>
            </>
        ),
    },
    {
        id: 'add-to-calendar',
        title: 'חדש: המשמרות שלכם ביומן',
        description: 'אפשר עכשיו להוסיף את המשמרות שלכם ליומן בטלפון או במחשב.',
        icon: <CalendarPlusIcon/>,
        date: '2026-11-15',
        content: () => (
            <>
                <Box sx={previewSx} aria-hidden>
                    <Box sx={sampleHeaderSx}>
                        <Box sx={sampleCalendarButtonSx}><CalendarPlusIcon/></Box>
                        <Typography variant="h6">יום</Typography>
                        <Typography variant="h6">לילה</Typography>
                    </Box>
                    <Box sx={sampleEventSx}>
                        <span>משמרת יום</span><span dir="ltr">08:00–20:00</span>
                    </Box>
                    <Box sx={sampleEventSx}>
                        <span>משמרת לילה</span><span dir="ltr">20:00–08:00</span>
                    </Box>
                </Box>
                <Box component="ul" sx={pointsSx}>
                    <Typography component="li" variant="body2">
                        לחצו על סמל היומן בפינה של טבלת המשמרות, ויורד קובץ עם המשמרות שלכם בשבוע המוצג.
                    </Typography>
                    <Typography component="li" variant="body2">
                        פותחים את הקובץ, והמשמרות נכנסות ליומן של <bdi>Google</bdi>, של <bdi>Apple</bdi> או של <bdi>Outlook</bdi>.
                    </Typography>
                </Box>
            </>
        ),
    },
];
