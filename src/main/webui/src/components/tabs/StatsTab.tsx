import React, {useEffect} from 'react';
import {observer} from 'mobx-react-lite';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {SxProps, Theme} from '@mui/material/styles';
import statsStore, {StatsSort, statsSortLabels, StatsView, UserStats} from '../../stores/StatsStore';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import NativeSelect from '../basicSharedComponents/NativeSelect';
import authStore from '../../stores/AuthStore';
import {stringToColor} from '../shiftTable/ShiftTable';
import {formatPaddedDate} from '../../dateFormat';

const panelSx: SxProps<Theme> = {
    p: {xs: 2, sm: 3},
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    backgroundImage: 'none',
};

const numberSx = {fontVariantNumeric: 'tabular-nums'} as const;

const sectionTitleSx = {fontSize: '1.1rem', fontWeight: 700} as const;

const cardsGridSx: SxProps<Theme> = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 2,
};

const percent = (value: number) => `${Math.round(value)}%`;

const extraChipSx: SxProps<Theme> = {
    px: 1,
    py: 0.25,
    borderRadius: 1.5,
    border: '1px solid',
    borderColor: 'divider',
    color: 'text.secondary',
    fontSize: '0.75rem',
    fontVariantNumeric: 'tabular-nums',
};

// The ribbon: the last 30 days split into each person's share, in their card color
type SharedUser = StatsView['users'][number];

const ShareRibbon: React.FC<{ users: SharedUser[] }> = ({users}) => (
    <Box role="img" aria-label="חלוקת המשמרות ב-30 הימים האחרונים"
         sx={{display: 'flex', height: 18, borderRadius: 9, overflow: 'hidden', gap: '2px', bgcolor: 'action.hover'}}>
        {users.map(user => (
            <Tooltip key={user.name} title={`${user.name}: ${percent(user.shareLast30Days)}`}>
                <Box sx={{width: `${user.shareLast30Days}%`, bgcolor: stringToColor(user.name)}}/>
            </Tooltip>
        ))}
    </Box>
);

// One person's line: their share against the busiest person's, with a tick at an equal share
const ShareRow: React.FC<{ user: SharedUser, maxShare: number, equalShare: number }> = ({user, maxShare, equalShare}) => {
    const color = stringToColor(user.name);
    return (
        <Box sx={{display: 'grid', gridTemplateColumns: 'minmax(88px, 1fr) 1.8fr auto', alignItems: 'center', gap: 1.5}}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, minWidth: 0}}>
                <Box sx={{width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0}}/>
                <Typography noWrap sx={{fontWeight: 600, fontSize: '0.9rem'}}>{user.name}</Typography>
            </Box>
            <Box sx={{position: 'relative', height: 10, borderRadius: 5, bgcolor: 'action.hover'}}>
                <Box sx={{position: 'absolute', insetBlock: 0, insetInlineStart: 0, borderRadius: 5, bgcolor: color,
                    width: `${maxShare ? user.shareLast30Days / maxShare * 100 : 0}%`}}/>
                <Box aria-hidden sx={{position: 'absolute', top: -3, bottom: -3, width: 2, borderRadius: 1,
                    bgcolor: 'text.secondary', insetInlineStart: `${equalShare / maxShare * 100}%`}}/>
            </Box>
            <Tooltip title={`${user.shiftsLast30Days} משמרות`}>
                <Typography sx={{...numberSx, fontSize: '0.85rem', minWidth: 64, textAlign: 'end'}}>
                    <Box component="span" sx={{fontWeight: 700}}>{percent(user.shareLast30Days)}</Box>
                    <Box component="span" sx={{color: 'text.secondary'}}> ({user.shiftsLast30Days})</Box>
                </Typography>
            </Tooltip>
        </Box>
    );
};

const TeamFigure: React.FC<{ value: number, label: string }> = ({value, label}) => (
    <Box sx={{flex: 1, minWidth: 0}}>
        <Typography sx={{...numberSx, fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2}}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Box>
);

const SharePanel: React.FC<{ stats: StatsView }> = ({stats}) => {
    const active = stats.users.filter(user => user.shiftsLast30Days > 0)
        .sort((a, b) => b.shareLast30Days - a.shareLast30Days);
    const maxShare = active[0]?.shareLast30Days ?? 0;
    // Equal among the people who aren't reservists
    const regulars = stats.users.filter(user => !user.reserve).length;
    const equalShare = regulars ? 100 / regulars : 0;
    return (
        <Paper elevation={0} sx={panelSx}>
            <Typography component="h2" sx={sectionTitleSx}>מי עשה את המשמרות</Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>ב-30 הימים האחרונים</Typography>
            {active.length > 0 ? <>
                <ShareRibbon users={active}/>
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.25, mt: 2.5}}>
                    {active.map(user => (
                        <ShareRow key={user.name} user={user} maxShare={Math.max(maxShare, equalShare)}
                                  equalShare={equalShare}/>
                    ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1.5}}>
                    בסוגריים מספר המשמרות. הקו האפור מסמן חלק שווה בין הכוננים ({percent(equalShare)}).
                </Typography>
            </> : (
                <Typography color="text.secondary">לא היו משמרות ב-30 הימים האחרונים.</Typography>
            )}
            <Divider sx={{my: 2.5}}/>
            <Box sx={{display: 'flex', gap: 2}}>
                <TeamFigure value={stats.shiftsLast30Days} label="ב-30 ימים"/>
                <TeamFigure value={stats.shiftsThisYear} label="השנה"/>
                <TeamFigure value={stats.shiftsAllTime} label="מאז ומעולם"/>
            </Box>
        </Paper>
    );
};

const Figure: React.FC<{ value: number, label: string }> = ({value, label}) => (
    <Box>
        <Typography sx={{...numberSx, fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.2}}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
);

// Day against night, as one split bar
const DayNightSplit: React.FC<{ user: UserStats }> = ({user}) => {
    const total = user.dayShifts + user.nightShifts;
    const dayPercent = total ? user.dayShifts / total * 100 : 50;
    return (
        <Box>
            <Box sx={{display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: '2px', bgcolor: 'action.hover'}}>
                {total ? <>
                    <Box sx={{width: `${dayPercent}%`, bgcolor: 'warning.main'}}/>
                    <Box sx={{flex: 1, bgcolor: 'primary.main'}}/>
                </> : null}
            </Box>
            <Box sx={{display: 'flex', justifyContent: 'space-between', mt: 0.75}}>
                <Typography variant="caption" sx={numberSx}>
                    <Box component="span" sx={{color: 'warning.main', fontWeight: 700}}>יום</Box> {user.dayShifts}
                </Typography>
                <Typography variant="caption" sx={numberSx}>
                    <Box component="span" sx={{color: 'primary.light', fontWeight: 700}}>לילה</Box> {user.nightShifts}
                </Typography>
            </Box>
        </Box>
    );
};

const UserStatsCard: React.FC<{ user: UserStats, isMe: boolean }> = ({user, isMe}) => {
    const color = stringToColor(user.name);
    const extras = [
        user.weekendShifts ? `${user.weekendShifts} בסופ"ש` : null,
        user.shadowShifts ? `כונן צל ${user.shadowShifts}` : null,
        user.jumpShifts ? `כונן הקפצה ${user.jumpShifts}` : null,
    ].filter((extra): extra is string => !!extra);
    return (
        <Paper elevation={0} sx={{...panelSx, p: 2, borderColor: isMe ? 'primary.main' : 'divider'} as SxProps<Theme>}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                <Avatar variant="rounded" sx={{width: 44, height: 44, borderRadius: 2.5, bgcolor: color,
                    color: 'common.white', fontWeight: 700}}>
                    {user.name.trim()[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{minWidth: 0}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <Typography noWrap sx={{fontWeight: 700}}>{user.name}</Typography>
                        {user.reserve ? <Box component="span" sx={extraChipSx}>מילואים</Box> : null}
                    </Box>
                    {user.firstShiftDate ? <>
                        <Typography variant="body2" sx={numberSx}>
                            {user.daysSinceFirstShift} ימים מהמשמרת הראשונה
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={numberSx}>
                            {formatPaddedDate(new Date(user.firstShiftDate))}
                        </Typography>
                    </> : (
                        <Typography variant="body2" color="text.secondary">עוד לא היו משמרות</Typography>
                    )}
                </Box>
            </Box>
            {user.shiftsAllTime > 0 ? <>
                <Box sx={{display: 'flex', gap: 3, mt: 2, mb: 2}}>
                    <Figure value={user.shiftsAllTime} label="סך הכול"/>
                    <Figure value={user.shiftsThisYear} label="השנה"/>
                    <Figure value={user.shiftsLast30Days} label="ב-30 ימים"/>
                </Box>
                <DayNightSplit user={user}/>
            </> : null}
            {extras.length > 0 ? (
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5}}>
                    {extras.map(extra => (
                        <Box key={extra} component="span" sx={extraChipSx}>{extra}</Box>
                    ))}
                </Box>
            ) : null}
        </Paper>
    );
};

const LoadingState = () => (
    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}} aria-busy>
        <Skeleton variant="rounded" height={320} sx={{borderRadius: 3}}/>
        <Box sx={cardsGridSx}>
            {[0, 1, 2].map(i => <Skeleton key={i} variant="rounded" height={170} sx={{borderRadius: 3}}/>)}
        </Box>
    </Box>
);

const StatsTab: React.FC = observer(() => {
    useEffect(() => {
        statsStore.fetchStats();
    }, []);

    const {failed} = statsStore;
    const stats = statsStore.view;
    const sorted = (users: UserStats[]) => statsStore.sorted(users, authStore.username);
    const sortOptions = Object.values(statsSortLabels);

    return (
        <Container maxWidth="md" dir="rtl" sx={{pb: 4}}>
            {failed && !stats ? (
                <Alert severity="error" sx={{borderRadius: 3}}
                       action={<Button color="inherit" size="small" onClick={statsStore.fetchStats}>נסה שוב</Button>}>
                    לא הצלחנו לטעון את הנתונים.
                </Alert>
            ) : !stats ? <LoadingState/> : (
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                    <SharePanel stats={stats}/>
                    <Box>
                        <Box sx={{display: 'flex', flexDirection: 'column', mb: 1.5}}>
                            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2}}>
                                <Typography component="h2" sx={sectionTitleSx}>הכוננים</Typography>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <Typography component="label" htmlFor="stats-sort" variant="body2" color="text.secondary">
                                        מיון לפי
                                    </Typography>
                                    <NativeSelect id="stats-sort" title="מיון" options={sortOptions} hideTitleElement
                                                  defaultValue={statsSortLabels[statsStore.sort]}
                                                  onChange={e => statsStore.setSort((Object.keys(statsSortLabels) as StatsSort[])
                                                      .find(key => statsSortLabels[key] === e.target.value) ?? 'name')}/>
                                </Box>
                            </Box>
                            {statsStore.hasReserves ? (
                                <FormControlLabel label="כלול מילואים" sx={{m: 0, mt: -1, gap: 0.25, alignSelf: 'flex-start'}}
                                                  slotProps={{typography: {variant: 'caption', color: 'text.secondary'}}}
                                                  control={<Checkbox size="small" sx={{p: 0.25, '& .MuiSvgIcon-root': {fontSize: 18}}}
                                                                     checked={statsStore.includeReserves}
                                                                     onChange={e => statsStore.setIncludeReserves(e.target.checked)}/>}/>
                            ) : null}
                        </Box>
                        <Box sx={cardsGridSx}>
                            {sorted(statsStore.listedUsers).map(user => (
                                <UserStatsCard key={user.name} user={user} isMe={user.name === authStore.username}/>
                            ))}
                        </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        נספרות משמרות שכבר עברו, ככונן רגיל בכל הטבלאות. כונן צל וכונן הקפצה נספרים בנפרד.
                    </Typography>
                </Box>
            )}
        </Container>
    );
});

export default StatsTab;
