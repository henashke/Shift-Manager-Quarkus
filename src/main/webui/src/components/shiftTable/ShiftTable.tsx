import React, {useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import store, {Shift, ShiftType, weekDatesFor} from '../../stores/ShiftStore';
import AssignToShiftDialog from '../dialogs/AssignToShiftDialog';
import AddRounded from '@mui/icons-material/AddRounded';
import ShiftTableActions from './ShiftTableActions';
import authStore from '../../stores/AuthStore';
import {alpha, Theme, useTheme} from '@mui/material/styles';
import notificationStore from '../../stores/NotificationStore';
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import {dangerMenuItemSx} from "../basicSharedComponents/menuStyles";
import {dateKey, formatDayMonth} from "../../dateFormat";
import CardSkeleton from "../basicSharedComponents/CardSkeleton";
import {SWIPE_PANE_GAP_PX, useWeekSwipe} from "./useWeekSwipe";

const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const shiftTypes = ['יום', 'לילה'] as const;

interface ShiftTableProps<T> {
    // While it returns true (and only once that has lasted a moment), every cell shows a skeleton card. A function read
    // here, so loading changes re-render only the table, not the tab around it
    isLoading?: () => boolean;
    // Whether a week's data is loaded, so the neighboring week shown mid-swipe can use skeletons when it isn't
    isWeekLoaded?: (weekOffset: number) => boolean;
    retrieveItemFromShift: (shift: Shift) => T | undefined;
    getItemName: (item: T, shift?: Shift) => string;
    getItemElement?: (item: T, shift: Shift) => JSX.Element;
    assignHandler: (shift: Shift, item: T) => void;
    unassignHandler: (shift: Shift) => void;
    itemList: T[];
    defaultItem?: T;
    isPendingItems?: boolean;
    onSave?: () => void;
    onCancel?: () => void;
    retrievePendingItem?: (shift: Shift) => T | undefined;
    onDropHandler?: (e: React.DragEvent, shift: Shift) => void;
    onDragEndHandler?: () => void;
    onDragStartHandler?: (e: React.DragEvent, draggedElement: T, fromShift?: Shift) => void;
    itemName: string;
    requireAdmin?: boolean;
    isRemoveItemDisabled?: (shift: Shift) => boolean;
    additionalContextMenuItems?: {
        label: string;
        icon: React.ReactNode;
        action: (shift: Shift) => void;
        disabled?: (shift: Shift) => boolean;
        // Left out of the menu for this shift
        hidden?: (shift: Shift) => boolean;
        // Shown in red with the remove action, after the divider
        danger?: boolean;
    }[];
    // More content under the cell's item (or its empty prompt), e.g. the shift's shadow and jump assignees
    renderCellExtras?: (shift: Shift) => React.ReactNode;
}

function ShiftTable<T>({
                           retrieveItemFromShift,
                           getItemName,
                           getItemElement,
                           assignHandler,
                           unassignHandler,
                           itemList,
                           defaultItem,
                           isPendingItems,
                           onSave,
                           onCancel,
                           retrievePendingItem,
                           onDropHandler,
                           onDragStartHandler,
                           onDragEndHandler,
                           itemName,
                           isRemoveItemDisabled,
                           requireAdmin = true,
                           isLoading,
                           isWeekLoaded = () => true,
                           additionalContextMenuItems,
                           renderCellExtras,
                       }: ShiftTableProps<T>) {
    const theme = useTheme();
    const isNarrowScreen = useMediaQuery(theme.breakpoints.down('md'), {noSsr: true}); // Switch to vertical on screens smaller than 'md' breakpoint
    const {weekDates} = store;
    const {trackRef, peek, handlers: swipeHandlers} =
        useWeekSwipe<HTMLDivElement>(store.weekOffset, direction => store.setWeekOffset(store.weekOffset + direction));
    const showSkeletons = useDelayedFlag(isLoading ? isLoading() : false, SKELETON_DELAY_MS);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    // Viewers who can't change this table (regular users on the assignments tab) only see it: no prompts, menus or dragging
    const readOnly = requireAdmin && !authStore.isAdmin();
    const emptyCell = readOnly ? null : <Typography variant="body1" sx={{color: 'primary.light'}}>{"שבץ " + itemName}</Typography>;

    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        shift: Shift | null
    } | null>(null);


    const onDrop = (e: React.DragEvent, shift: Shift) => {
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        onDropHandler?.(e, shift);
        onDragEndHandler && onDragEndHandler();
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleCellClick = (shift: Shift) => {
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        setSelectedShift(shift);
        setAssignDialogOpen(true);
    };

    const onDragStart = (e: React.DragEvent, draggedItem: T, fromShift?: Shift) => {
        onDragStartHandler?.(e, draggedItem, fromShift);
    };

    const handleContextMenu = (event: React.MouseEvent, shift: Shift) => {
        event.preventDefault();
        setContextMenu(
            contextMenu === null
                ? {
                    mouseX: event.clientX - 2,
                    mouseY: event.clientY - 4,
                    shift,
                }
                : null,
        );
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleAssignUser = () => {
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        if (contextMenu?.shift) {
            setSelectedShift(contextMenu.shift);
            setAssignDialogOpen(true);
        }
        handleCloseContextMenu();
    };

    const handleRemoveItem = () => {
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        if (contextMenu?.shift) {
            unassignHandler?.(contextMenu.shift);
        }
        handleCloseContextMenu();
    };

    const getPendingOrAssignedItem = (shift: Shift) => {
        if (retrievePendingItem) {
            const pending = retrievePendingItem(shift);
            if (pending) return pending;
        }
        return retrieveItemFromShift(shift);
    };

    const getDefaultItemElement = (item: T, shift: Shift) => {
        const isPending = retrievePendingItem?.(shift) !== undefined;
        return <Box sx={{
            background: theme => isPending ? theme.palette.secondary.main : theme.palette.primary.main,
            color: 'common.white',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
        }}>
            {getItemName(item, shift)}
        </Box>
    }

    const renderItemElement = (item: T, shift: Shift) => {
        return getItemElement ? getItemElement(item, shift) : getDefaultItemElement(item, shift);
    }

    // preview: the neighboring week beside the table mid-swipe, read-only (skeletons when its data isn't loaded)
    const createTableCell = (date: Date, shiftType: ShiftType, preview?: { loaded: boolean }) => {
        const shift = {date: date, type: shiftType};
        const cellSx = {minHeight: 48, color: 'common.white', bgcolor: isToday(date) ? todayTint : undefined};
        if (preview) {
            const previewItem = preview.loaded ? getPendingOrAssignedItem(shift) : undefined;
            return (
                <TableCell key={'table-cell-' + dateKey(date) + shiftType} align="center" sx={cellSx}>
                    {!preview.loaded ? <CardSkeleton/>
                        : <>
                            {previewItem ? renderItemElement(previewItem, shift) : emptyCell}
                            {renderCellExtras?.(shift)}
                        </>}
                </TableCell>
            );
        }
        if (showSkeletons) {
            // Day, then shift type, so the shimmer travels across the table as one wave
            const delayMs = date.getDay() * 90 + shiftTypes.indexOf(shiftType) * 45;
            return (
                <TableCell key={'table-cell-' + dateKey(date) + shiftType} align="center" sx={cellSx}>
                    <CardSkeleton delayMs={delayMs}/>
                </TableCell>
            );
        }
        const item = getPendingOrAssignedItem(shift);
        if (readOnly) {
            return (
                <TableCell key={'table-cell-' + dateKey(date) + shiftType} align="center" sx={cellSx}>
                    {item ? renderItemElement(item, shift) : null}
                    {renderCellExtras?.(shift)}
                </TableCell>
            );
        }
        return (
            <TableCell
                key={'table-cell-' + dateKey(date) + shiftType}
                align="center"
                onDrop={e => onDrop(e, shift)}
                onDragOver={onDragOver}
                onClick={(e) => shift && isAllContextMenuDisabledButAddItem(shift) ? handleCellClick(shift) : handleContextMenu(e, shift)}
                onContextMenu={e => shift && handleContextMenu(e, shift)}
                sx={{...cellSx, cursor: 'pointer'}}
            >
                {item ? (
                    <Box
                        key={"assigned-" + dateKey(date) + shiftType}
                        draggable
                        onDragStart={e => onDragStart(e, item, shift)}
                        onDragEnd={onDragEndHandler}
                    >
                        {renderItemElement(item, shift)}
                    </Box>
                ) : emptyCell}
                {renderCellExtras?.(shift)}
            </TableCell>
        );
    }

    const renderTable = (dates: Date[], preview?: { loaded: boolean }) => (
        <Table className="shift-table">
            <TableHead>
                <TableRow>
                    <TableCell></TableCell>
                    {isNarrowScreen
                        ? shiftTypes.map(shiftType => <ShiftTypeHeaderTableCell key={shiftType} shiftType={shiftType}/>)
                        : dates.map(date => <WeekDayHeaderTableCell key={dateKey(date)} date={date}/>)}
                </TableRow>
            </TableHead>
            <TableBody>
                {isNarrowScreen
                    ? dates.map(date => (
                        <TableRow key={'table-row-' + dateKey(date)}>
                            <WeekDayHeaderTableCell date={date}/>
                            {shiftTypes.map(shiftType => createTableCell(date, shiftType, preview))}
                        </TableRow>
                    ))
                    : shiftTypes.map(shiftType => (
                        <TableRow key={shiftType}>
                            <ShiftTypeHeaderTableCell shiftType={shiftType}/>
                            {dates.map(date => createTableCell(date, shiftType, preview))}
                        </TableRow>
                    ))}
            </TableBody>
        </Table>
    );

    // A Menu takes its items as direct children, so these are rendered as an array rather than a fragment
    const renderAdditionalMenuItems = (danger: boolean) => {
        const shift = contextMenu?.shift;
        if (!additionalContextMenuItems || !shift) return null;
        return additionalContextMenuItems
            .filter(menuItem => !!menuItem.danger === danger && !menuItem.hidden?.(shift))
            .map(menuItem => (
                <MenuItem
                    key={menuItem.label}
                    sx={danger ? dangerMenuItemSx : undefined}
                    onClick={() => {
                        menuItem.action(shift);
                        handleCloseContextMenu();
                    }}
                    disabled={menuItem.disabled ? menuItem.disabled(shift) : false}
                >
                    <ListItemIcon>{menuItem.icon}</ListItemIcon>
                    <ListItemText>{menuItem.label}</ListItemText>
                </MenuItem>
            ));
    };

    const isAllContextMenuDisabledButAddItem = (shift: Shift) => {
        if (isRemoveItemDisabled === undefined || !(isRemoveItemDisabled(shift))) {
            return false
        }
        if (additionalContextMenuItems) {
            for (const menuItem of additionalContextMenuItems) {
                if (menuItem.hidden?.(shift)) continue;
                if (menuItem.disabled !== undefined && !menuItem.disabled(shift)) {
                    return false
                }
            }
        }
        return true
    }

    return (

        <Box sx={{display: 'flex', gap: 2, height: '100%', mb: {xs: 2, md: 4}, flexDirection: isNarrowScreen ? 'column' : 'row'}}>
            {
                isPendingItems && onSave && onCancel &&
                <ShiftTableActions
                    onSave={onSave}
                    onCancel={onCancel}
                    requireAdmin={requireAdmin}
                />
            }
            {/* The track moves under the finger; mid-swipe it also carries the neighboring week beside the table */}
            <Box ref={trackRef} {...swipeHandlers}
                 // Narrow screens: vertical scrolling stays with the browser, sideways gestures change the week
                 sx={{position: 'relative', flex: 1, minWidth: 0, touchAction: isNarrowScreen ? 'pan-y' : undefined,
                     // Its own GPU layer from the start, so a swipe doesn't have to paint one when the thumb starts moving
                     willChange: isNarrowScreen ? 'transform' : undefined}}>
            {peek !== 0 ? (
                <Paper aria-hidden dir="rtl" sx={{
                    ...previewPaneSx,
                    left: peek === 1 ? `calc(-100% - ${SWIPE_PANE_GAP_PX}px)` : `calc(100% + ${SWIPE_PANE_GAP_PX}px)`,
                }}>
                    {renderTable(weekDatesFor(store.weekOffset + peek), {loaded: isWeekLoaded(store.weekOffset + peek)})}
                </Paper>
            ) : null}
            <TableContainer component={Paper} aria-busy={showSkeletons}
                            sx={{borderRadius: 3, boxShadow: 3, direction: 'rtl', height: '100%'}}
                            dir="rtl">
                {renderTable(weekDates)}
                <AssignToShiftDialog
                    open={assignDialogOpen}
                    onClose={() => setAssignDialogOpen(false)}
                    shift={selectedShift}
                    itemList={itemList}
                    defaultItem={defaultItem}
                    itemTitle={itemName}
                    getItemName={getItemName}
                    assignFunction={assignHandler}
                />

                <Menu
                    open={contextMenu !== null}
                    onClose={handleCloseContextMenu}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        contextMenu !== null
                            ? {top: contextMenu.mouseY, left: contextMenu.mouseX}
                            : undefined
                    }
                >
                    <MenuItem onClick={handleAssignUser}>
                        <ListItemIcon><AddRounded fontSize="small"/></ListItemIcon>
                        <ListItemText>שבץ {itemName}</ListItemText>
                    </MenuItem>
                    {renderAdditionalMenuItems(false)}
                    <Divider sx={{my: 0.5}}/>
                    {renderAdditionalMenuItems(true)}
                    <MenuItem onClick={handleRemoveItem} sx={dangerMenuItemSx}
                              disabled={isRemoveItemDisabled && isRemoveItemDisabled(contextMenu?.shift!)}
                    >
                        <ListItemIcon><DeleteOutlineRounded fontSize="small"/></ListItemIcon>
                        <ListItemText>הסר {itemName}</ListItemText>
                    </MenuItem>
                </Menu>
            </TableContainer>
            </Box>
        </Box>
    );
}

const previewPaneSx = {
    position: 'absolute',
    top: 0,
    width: '100%',
    borderRadius: 3,
    boxShadow: 3,
    overflow: 'hidden',
    pointerEvents: 'none',
} as const;

// Fast responses keep showing the current data instead of flashing skeletons
const SKELETON_DELAY_MS = 200;

// True only once `value` has stayed true for `delayMs`; turns false immediately
const useDelayedFlag = (value: boolean, delayMs: number) => {
    const [delayed, setDelayed] = useState(false);
    useEffect(() => {
        if (!value) {
            setDelayed(false);
            return;
        }
        const timer = setTimeout(() => setDelayed(true), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);
    return value && delayed;
};

const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

// A faint wash of the primary color marks today's column
const todayTint = (theme: Theme) => alpha(theme.palette.primary.main, 0.08);

const WeekDayHeaderTableCell = ({date}: { date: Date }) => (
    <TableCell sx={{bgcolor: isToday(date) ? todayTint : undefined}} align="center">
        <Typography variant={"h6"}>{days[date.getDay()]}</Typography>
        <Typography>{formatDayMonth(date)}</Typography>
    </TableCell>
);

const ShiftTypeHeaderTableCell = ({shiftType}: { shiftType: ShiftType }) => (
    <TableCell align="center">
        <Typography variant={"h6"}>{shiftType}</Typography>
    </TableCell>
);

export function stringToColor(str: string): string {
    // Hash string → number
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    let hue = Math.abs(hash) % 360;

    // Skip the light green band (70–160°)
    if (hue >= 70 && hue <= 110) {
        hue = (hue + 120) % 360; // push it well away
    }

    // Slightly broader saturation & lightness for more diversity
    const sat = 45 + (Math.abs(hash >> 2) % 50);   // 45–95%
    const light = 30 + (Math.abs(hash >> 4) % 30); // 30–70%

    return `hsl(${hue}, ${sat}%, ${light}%)`;
}

const ObserverShiftTable = observer(ShiftTable) as typeof ShiftTable;
export default ObserverShiftTable;
