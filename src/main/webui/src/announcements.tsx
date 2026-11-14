import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NewReleasesOutlined from '@mui/icons-material/NewReleasesOutlined';
import SmartToyOutlined from '@mui/icons-material/SmartToyOutlined';
import TableChartOutlined from '@mui/icons-material/TableChartOutlined';
import UserCard from './components/basicSharedComponents/UserCard';
import {mcpExamples, OPEN_CONNECT_STATE} from './components/dialogs/McpConnectDialog';
import {primaryGradient} from './theme';

/**
 * "What's new" announcements, each shown once per device (seen ids are kept in localStorage). Only one shows per visit:
 * the oldest one not seen yet, so keep the list in the order the features shipped. To announce a feature, add an entry
 * at the end with a new, never reused id; delete entries once they're old.
 */
export interface Announcement {
    id: string;
    title: string;
    // One line under the title
    description?: string;
    icon?: React.ReactNode;
    // Defaults to everyone
    audience?: 'all' | 'admin';
    // Not shown after this date (yyyy-mm-dd), so people who join much later don't get stale news
    showUntil?: string;
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

export const announcements: Announcement[] = [
    {
        id: 'shadow-and-jump-shifts',
        title: 'חדש: כונן צל וכונן הקפצה',
        description: 'לכל משמרת אפשר עכשיו לשבץ גם כונן צל וכונן הקפצה.',
        icon: <NewReleasesOutlined/>,
        showUntil: '2026-12-31',
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
        showUntil: '2026-12-31',
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
        showUntil: '2027-03-31',
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
];
