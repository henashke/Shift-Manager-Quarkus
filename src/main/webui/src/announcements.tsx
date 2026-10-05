import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NewReleasesOutlined from '@mui/icons-material/NewReleasesOutlined';
import UserCard from './components/basicSharedComponents/UserCard';

/**
 * "What's new" announcements, each shown once per device (seen ids are kept in localStorage). To announce a feature,
 * add an entry at the end with a new, never reused id; delete entries once they're old.
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

const pointsSx = {m: 0, paddingInlineStart: 2.5, display: 'flex', flexDirection: 'column', gap: 1} as const;

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
];
