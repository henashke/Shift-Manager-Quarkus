import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
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

interface ContextMenuItem {
    label: string;
    icon: React.ReactNode;
    action: (shift: Shift) => void;
    disabled?: (shift: Shift) => boolean;
    // Left out of the menu for this shift
    hidden?: (shift: Shift) => boolean;
    // Shown in red with the remove action, after the divider
    danger?: boolean;
}

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
    onSave?: () => void | Promise<unknown>;
    onCancel?: () => void;
    retrievePendingItem?: (shift: Shift) => T | undefined;
    onDropHandler?: (e: React.DragEvent, shift: Shift) => void;
    onDragEndHandler?: () => void;
    onDragStartHandler?: (e: React.DragEvent, draggedElement: T, fromShift?: Shift) => void;
    itemName: string;
    requireAdmin?: boolean;
    isRemoveItemDisabled?: (shift: Shift) => boolean;
    additionalContextMenuItems?: ContextMenuItem[];
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
    // The cell menu and the assign dialog keep their own state (CellActions), so opening them doesn't re-render the cells
    const actions = useRef<CellActionsController | null>(null);
    // Viewers who can't change this table (regular users on the assignments tab) only see it: no prompts, menus or dragging
    const readOnly = requireAdmin && !authStore.isAdmin();
    const emptyCell = readOnly ? null : (
        <Box component="span" sx={emptyCellSx} aria-label={'שבץ ' + itemName}>
            <AddRounded sx={{fontSize: 16}}/>{itemName}
        </Box>
    );

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
        actions.current?.openAssign(shift);
    };

    const onDragStart = (e: React.DragEvent, draggedItem: T, fromShift?: Shift) => {
        onDragStartHandler?.(e, draggedItem, fromShift);
    };

    const handleContextMenu = (event: React.MouseEvent, shift: Shift) => {
        event.preventDefault();
        actions.current?.openMenu(event.clientX - 2, event.clientY - 4, shift);
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
                sx={{...cellSx, ...pressableCellSx}}
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
            {onSave && onCancel ? (
                <ShiftTableActions open={!!isPendingItems} onSave={onSave} onCancel={onCancel} requireAdmin={requireAdmin}/>
            ) : null}
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
                <CellActions controller={actions} itemList={itemList} defaultItem={defaultItem} itemName={itemName}
                             getItemName={getItemName} assignHandler={assignHandler} unassignHandler={unassignHandler}
                             requireAdmin={requireAdmin} isRemoveItemDisabled={isRemoveItemDisabled}
                             additionalContextMenuItems={additionalContextMenuItems}/>
            </TableContainer>
            </Box>
        </Box>
    );
}

// A quiet placeholder in every free slot: dashed, so it reads as "something can go here" without 14 cells shouting it
const emptyCellSx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.25,
    px: 1.25,
    py: 0.5,
    borderRadius: 99,
    border: '1px dashed',
    borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.4),
    color: 'primary.light',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'border-color 150ms, background-color 150ms',
} as const;

// Tapping a cell highlights it the moment the finger lands
const pressableCellSx = {
    cursor: 'pointer',
    transition: 'background-color 200ms',
    '&:active': {
        bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.1),
        transitionDuration: '0ms',
    },
    '@media (hover: hover)': {
        '&:hover > span': {
            borderColor: 'primary.main',
            bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.08),
        },
    },
} as const;

interface CellActionsController {
    openMenu: (x: number, y: number, shift: Shift) => void;
    openAssign: (shift: Shift) => void;
}

interface CellActionsProps<T> extends Pick<ShiftTableProps<T>, 'itemList' | 'defaultItem' | 'itemName' | 'getItemName'
    | 'assignHandler' | 'unassignHandler' | 'requireAdmin' | 'isRemoveItemDisabled' | 'additionalContextMenuItems'> {
    controller: React.MutableRefObject<CellActionsController | null>;
}

// A cell's menu and the assign dialog. Their open state lives here rather than in the table, so opening or closing
// them re-renders only this, not every cell.
function CellActionsImpl<T>({controller, itemList, defaultItem, itemName, getItemName, assignHandler, unassignHandler,
                                requireAdmin = true, isRemoveItemDisabled, additionalContextMenuItems}: CellActionsProps<T>) {
    const [menu, setMenu] = useState<{ x: number, y: number, shift: Shift } | null>(null);
    const [assignShift, setAssignShift] = useState<Shift | null>(null);
    const [assignOpen, setAssignOpen] = useState(false);

    useLayoutEffect(() => {
        controller.current = {
            openMenu: (x, y, shift) => setMenu({x, y, shift}),
            openAssign: shift => {
                setAssignShift(shift);
                setAssignOpen(true);
            },
        };
        return () => {
            controller.current = null;
        };
    }, [controller]);

    const closeMenu = () => setMenu(null);
    const guarded = (action: () => void) => () => {
        if (requireAdmin && !authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        action();
        closeMenu();
    };

    // A Menu takes its items as direct children, so these are rendered as an array rather than a fragment
    const renderAdditionalMenuItems = (danger: boolean) => {
        const shift = menu?.shift;
        if (!additionalContextMenuItems || !shift) return null;
        return additionalContextMenuItems
            .filter(menuItem => !!menuItem.danger === danger && !menuItem.hidden?.(shift))
            .map(menuItem => (
                <MenuItem key={menuItem.label} sx={danger ? dangerMenuItemSx : undefined}
                          onClick={() => {
                              menuItem.action(shift);
                              closeMenu();
                          }}
                          disabled={menuItem.disabled ? menuItem.disabled(shift) : false}>
                    <ListItemIcon>{menuItem.icon}</ListItemIcon>
                    <ListItemText>{menuItem.label}</ListItemText>
                </MenuItem>
            ));
    };

    return (
        <>
            <AssignToShiftDialog open={assignOpen} onClose={() => setAssignOpen(false)} shift={assignShift}
                                 itemList={itemList} defaultItem={defaultItem} itemTitle={itemName}
                                 getItemName={getItemName} assignFunction={assignHandler}/>
            <Menu open={menu !== null} onClose={closeMenu} anchorReference="anchorPosition"
                  anchorPosition={menu ? {top: menu.y, left: menu.x} : undefined}>
                <MenuItem onClick={guarded(() => menu && controller.current?.openAssign(menu.shift))}>
                    <ListItemIcon><AddRounded fontSize="small"/></ListItemIcon>
                    <ListItemText>שבץ {itemName}</ListItemText>
                </MenuItem>
                {renderAdditionalMenuItems(false)}
                <Divider sx={{my: 0.5}}/>
                {renderAdditionalMenuItems(true)}
                <MenuItem onClick={guarded(() => menu && unassignHandler(menu.shift))} sx={dangerMenuItemSx}
                          disabled={!!menu && !!isRemoveItemDisabled?.(menu.shift)}>
                    <ListItemIcon><DeleteOutlineRounded fontSize="small"/></ListItemIcon>
                    <ListItemText>הסר {itemName}</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
}

const CellActions = observer(CellActionsImpl) as typeof CellActionsImpl;

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
