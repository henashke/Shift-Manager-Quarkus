import React from 'react';
import {observer} from 'mobx-react-lite';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import {SxProps, Theme} from '@mui/material/styles';
import shiftStore, {REGULAR_TABLE_LABEL} from '../../stores/ShiftStore';
import {primaryGradient} from '../../theme';

// A smaller version of the top bar's segmented tabs
const tabsSx: SxProps<Theme> = {
    minHeight: 0,
    p: 0.5,
    borderRadius: 2.5,
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
    px: 1.75,
    py: 0.5,
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'text.secondary',
    '&.Mui-selected': {color: 'common.white'},
};

const REGULAR_VALUE = '';


// Switches between the week's regular table and its extra ones; shows only on weeks that have extra tables. Its own
// observer, so a week or table switch doesn't re-render the whole tab.
const ShiftTableTabs: React.FC = observer(() => {
    const tables = shiftStore.tablesForCurrentWeek;
    if (tables.length === 0) return null;
    return (
        <Box sx={{display: 'flex', justifyContent: 'center', mb: 2, minWidth: 0}}>
            <Tabs value={shiftStore.activeTable ?? REGULAR_VALUE} variant="scrollable" scrollButtons={false}
                  onChange={(_, value: string) => shiftStore.setSelectedTable(value === REGULAR_VALUE ? null : value)}
                  aria-label="טבלאות השבוע" sx={tabsSx}>
                <Tab value={REGULAR_VALUE} label={REGULAR_TABLE_LABEL} sx={tabSx}/>
                {tables.map(table => <Tab key={table} value={table} label={table} sx={tabSx}/>)}
            </Tabs>

        </Box>
    );
});

export default ShiftTableTabs;
