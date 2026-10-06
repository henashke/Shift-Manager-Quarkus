import React, {useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Container from '@mui/material/Container';
import InputBase from '@mui/material/InputBase';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import {alpha, SxProps, Theme} from '@mui/material/styles';
import CalculateOutlined from '@mui/icons-material/CalculateOutlined';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import shiftWeightStore, {ShiftWeight, ShiftWeightPreset} from '../../stores/ShiftWeightStore';
import PresetNameDialog from '../dialogs/PresetNameDialog';
import shiftStore, {ShiftType} from "../../stores/ShiftStore";
import authStore from '../../stores/AuthStore';
import RecalculateDialog from "../dialogs/RecalculateDialog";
import NativeSelect from "../basicSharedComponents/NativeSelect";
import ShiftTableActions from "../shiftTable/ShiftTableActions";

const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const shiftTypes: ShiftType[] = ['יום', 'לילה'];

type Weights = Record<string, Record<ShiftType, string>>;

const weightsOf = (preset?: ShiftWeightPreset): Weights => {
    const weights: Weights = {};
    daysOfWeek.forEach(day => {
        weights[day] = {'יום': '0', 'לילה': '0'};
    });
    preset?.weights.forEach(w => {
        if (!weights[w.day]) weights[w.day] = {'יום': '0', 'לילה': '0'};
        weights[w.day][w.shiftType] = w.weight.toString();
    });
    return weights;
};

// Grouped sections like iOS Settings: a small heading above a rounded card of rows
const sectionTitleSx: SxProps<Theme> = {fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em'};

const groupSx: SxProps<Theme> = {
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    backgroundImage: 'none',
    overflow: 'hidden',
};

const rowSx: SxProps<Theme> = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    minHeight: 52,
    px: 2,
    '&:not(:last-of-type)': {borderBottom: '1px solid', borderColor: 'divider'},
};

const weightsGridSx: SxProps<Theme> = {
    display: 'grid',
    gridTemplateColumns: '1fr 88px 88px',
    alignItems: 'center',
    columnGap: 1.5,
};

const weightInputSx: SxProps<Theme> = theme => ({
    height: 38,
    borderRadius: 2.5,
    bgcolor: 'action.hover',
    border: '1px solid transparent',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    transition: 'border-color 150ms, box-shadow 200ms, background-color 150ms',
    '& input': {textAlign: 'center', p: 0},
    '&.Mui-focused': {
        borderColor: 'primary.main',
        bgcolor: 'background.paper',
        boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.18)}`,
    },
});

const shiftTypeIcons: Record<ShiftType, React.ReactNode> = {
    'יום': <LightModeOutlined sx={{fontSize: 16, color: 'warning.main'}}/>,
    'לילה': <DarkModeOutlined sx={{fontSize: 16, color: 'primary.light'}}/>,
};

// A tappable row with an icon tile, like a cell in iOS Settings
const ActionRow: React.FC<{ icon: React.ReactNode, label: string, detail: string, onClick: () => void, danger?: boolean }> =
    ({icon, label, detail, onClick, danger}) => (
        <ButtonBase onClick={onClick} sx={{
            ...rowSx,
            width: '100%',
            py: 1.25,
            justifyContent: 'flex-start',
            textAlign: 'start',
            transition: 'background-color 200ms',
            '&:active': {bgcolor: 'action.selected', transitionDuration: '0ms'},
            '@media (hover: hover)': {'&:hover': {bgcolor: 'action.hover'}},
        } as SxProps<Theme>}>
            <Box sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                color: danger ? 'error.main' : 'primary.light',
                bgcolor: theme => alpha(danger ? theme.palette.error.main : theme.palette.primary.main, 0.16),
            }}>
                {icon}
            </Box>
            <Box sx={{flex: 1, minWidth: 0}}>
                <Typography sx={{fontWeight: 600, color: danger ? 'error.main' : 'text.primary'}}>{label}</Typography>
                <Typography variant="caption" color="text.secondary">{detail}</Typography>
            </Box>
            <ChevronLeftRounded sx={{color: 'text.disabled'}}/>
        </ButtonBase>
    );

const SettingsTab: React.FC = observer(() => {
    // The preset being viewed; until one is picked, the default one
    const [picked, setPicked] = useState<string>('');
    const preset = picked || shiftWeightStore.currentPresetObject?.name || '';
    const presetObj = shiftWeightStore.presets.get(preset);
    const [settings, setSettings] = useState<Weights>(() => weightsOf(presetObj));
    const [presetNameDialogOpen, setPresetNameDialogOpen] = useState(false);
    const [recalculateScoresDialogOpen, setRecalculateScoresDialogOpen] = useState(false);

    useEffect(() => {
        shiftWeightStore.fetchPresets();
    }, []);

    // Shows the preset's weights once it's picked or has loaded
    useEffect(() => {
        setSettings(weightsOf(presetObj));
    }, [presetObj]);

    const handleChange = (day: string, shiftType: ShiftType, value: string) => {
        setSettings(prev => ({...prev, [day]: {...prev[day], [shiftType]: value.replace(/[^\d.]/g, '')}}));
    };

    const handlePresetNameSave = async (name: string) => {
        setPresetNameDialogOpen(false);
        const weights: ShiftWeight[] = [];
        for (const day of daysOfWeek) {
            for (const type of shiftTypes) {
                weights.push({day, shiftType: type, weight: Number(settings[day]?.[type] || 0)});
            }
        }
        await shiftWeightStore.savePreset({name, weights});
        setPicked(name);
    };

    const isSettingsDifferent = () => {
        if (!presetObj) return false;
        const saved = weightsOf(presetObj);
        return daysOfWeek.some(day => shiftTypes.some(type => saved[day][type] !== (settings[day]?.[type] || '0')));
    };

    // Regular users can browse the presets but not change them, recalculate or back up
    const isAdmin = authStore.isAdmin();
    const dirty = isAdmin && isSettingsDifferent();
    const isDefaultPreset = preset === shiftWeightStore.currentPresetObject?.name;
    const presetOptions = Array.from(shiftWeightStore.presets.keys());

    return (
        <Container maxWidth="sm" dir="rtl" sx={{display: 'flex', flexDirection: 'column', gap: 1.5, pb: 4}}>
            <Box>
                <Typography component="h2" sx={sectionTitleSx}>פריסט ניקוד</Typography>
                <Typography variant="body2" color="text.secondary">כמה נקודות שווה כל משמרת בחישוב ההוגנות</Typography>
            </Box>
            <Paper elevation={0} sx={groupSx}>
                <Box sx={rowSx}>
                    <Typography component="label" htmlFor="preset-select" sx={{fontWeight: 600, flex: 1}}>פריסט</Typography>
                    {/* Remounted when the preset loads or changes, since the native select keeps its own value */}
                    <NativeSelect key={preset} id="preset-select" title="פריסט" options={presetOptions}
                                  defaultValue={preset} hideTitleElement
                                  onChange={e => setPicked(e.target.value)}/>
                </Box>
                <Box sx={{...rowSx, minHeight: 48} as SxProps<Theme>}>
                    {isDefaultPreset ? (
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75, color: 'success.main'}}>
                            <CheckCircleRounded sx={{fontSize: 18}}/>
                            <Typography variant="body2" sx={{fontWeight: 600}}>ברירת המחדל לשיבוצים חדשים</Typography>
                        </Box>
                    ) : (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{flex: 1}}>
                                לא ברירת המחדל
                            </Typography>
                            {isAdmin ? (
                                <Button size="small" onClick={() => shiftWeightStore.setCurrentPresetOnServer(preset)}
                                        disabled={dirty}>
                                    הפוך לברירת מחדל
                                </Button>
                            ) : null}
                        </>
                    )}
                </Box>
            </Paper>

            <Paper elevation={0} sx={{...groupSx, p: 2} as SxProps<Theme>}>
                <Box sx={{...weightsGridSx, mb: 1}}>
                    <span/>
                    {shiftTypes.map(type => (
                        <Box key={type} sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5}}>
                            {shiftTypeIcons[type]}
                            <Typography variant="body2" color="text.secondary" sx={{fontWeight: 600}}>{type}</Typography>
                        </Box>
                    ))}
                </Box>
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                    {daysOfWeek.map(day => (
                        <Box key={day} sx={weightsGridSx}>
                            <Typography sx={{fontWeight: 600}}>{day}</Typography>
                            {shiftTypes.map(type => isAdmin ? (
                                <InputBase key={type} value={settings[day]?.[type] ?? '0'} sx={weightInputSx}
                                           onChange={e => handleChange(day, type, e.target.value)}
                                           onFocus={e => e.target.select()}
                                           inputProps={{inputMode: 'decimal', 'aria-label': `${day}, ${type}`}}/>
                            ) : (
                                <Typography key={type} align="center" sx={{fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>
                                    {settings[day]?.[type] ?? '0'}
                                </Typography>
                            ))}
                        </Box>
                    ))}
                </Box>
            </Paper>

            {isAdmin ? <>
                <Typography component="h2" sx={{...sectionTitleSx, mt: 2} as SxProps<Theme>}>כלים</Typography>
                <Paper elevation={0} sx={groupSx}>
                    <ActionRow icon={<FileDownloadOutlined fontSize="small"/>} label="גיבוי נתוני המערכת"
                               detail="מוריד קובץ zip עם כל הנתונים"
                               onClick={() => shiftWeightStore.backupSystemData()}/>
                    <ActionRow icon={<CalculateOutlined fontSize="small"/>} label="חישוב ניקוד מחדש"
                               detail="מחשב את הניקוד של כולם מהמשמרות שלהם"
                               onClick={() => setRecalculateScoresDialogOpen(true)} danger/>
                </Paper>
            </> : null}

            <ShiftTableActions open={dirty} onSave={() => setPresetNameDialogOpen(true)}
                               onCancel={() => setSettings(weightsOf(presetObj))}/>
            <PresetNameDialog open={presetNameDialogOpen} defaultValue={preset}
                              onClose={() => setPresetNameDialogOpen(false)} onSave={handlePresetNameSave}/>
            <RecalculateDialog handleConfirm={shiftStore.recalculateScores}
                               open={recalculateScoresDialogOpen}
                               handleDialogClose={() => setRecalculateScoresDialogOpen(false)}/>
        </Container>
    );
});

export default SettingsTab;
