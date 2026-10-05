import React, {useEffect, useState} from 'react';
import CalendarNavigation from '../shiftTable/CalendarNavigation';
import ShiftTable from '../shiftTable/ShiftTable';
import UserCard from '../basicSharedComponents/UserCard';
import UserList from '../draggableLists/UserList';
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Snackbar from "@mui/material/Snackbar";
import {SxProps, Theme} from "@mui/material/styles";
import usersStore from "../../stores/UsersStore";
import {observer} from 'mobx-react-lite';
import {reaction} from 'mobx';
import shiftStore, {AssignedShift, isInWindow, sameShift, Shift, ShiftKind, shiftKindLabels, User} from "../../stores/ShiftStore";
import authStore from "../../stores/AuthStore";
import notificationStore from "../../stores/NotificationStore";
import shiftWeightStore from "../../stores/ShiftWeightStore";
import ChangeAssignedShiftPresetDialog from '../dialogs/ChangeAssignedShiftPresetDialog';
import Autorenew from '@mui/icons-material/Autorenew';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import TuneRounded from '@mui/icons-material/TuneRounded';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import BoltOutlined from '@mui/icons-material/BoltOutlined';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import AssignToShiftDialog from "../dialogs/AssignToShiftDialog";
import ResetWeeklyShiftsDialog from "../dialogs/ResetWeeklyShiftsDialog";
import SuggestAssignmentsDialog from "../dialogs/SuggestAssignmentsDialog";
import {primaryGradient} from '../../theme';

const actionButtonSx = {flex: 1, py: 1.25} as const;

// The optional roles under a shift's regular assignee
const extraKinds: ShiftKind[] = ['SHADOW', 'JUMP'];
const extraKindIcons: Record<string, React.ReactNode> = {
    SHADOW: <PersonAddAltOutlined fontSize="small"/>,
    JUMP: <BoltOutlined fontSize="small"/>,
};
const cellExtrasSx = {display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, mt: 0.75} as const;

// Keeps the gradient while disabled so the loading state stays visible instead of turning grey
const suggestButtonSx: SxProps<Theme> = {
    ...actionButtonSx,
    '&.Mui-disabled': {
        background: primaryGradient,
        color: 'common.white',
        opacity: 0.85,
    },
};

const AssignmentTab: React.FC = observer(() => {
    const {users} = usersStore;
    const [isDragged, setIsDragged] = useState(false);
    const [isChangePresetDialogOpen, setIsChangePresetDialogOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<AssignedShift | undefined>(undefined);
    const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    // The shadow or jump role being set, from the shift's menu
    const [extraRoleTarget, setExtraRoleTarget] = useState<{ shift: Shift, kind: ShiftKind } | null>(null);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetError, setResetError] = useState(false);

    useEffect(() => {
        shiftWeightStore.fetchPresets();
        usersStore.fetchUsers();
    }, []);

    // A reaction, not an effect on the week read in render: reading it here would re-render the whole tab (tray, cards,
    // dialogs) on every week switch
    useEffect(() => reaction(() => shiftStore.weekOffset, offset => shiftStore.fetchShifts(offset), {fireImmediately: true}), []);

    const onDragStart = (e: React.DragEvent, user: User, fromShift?: Shift) => {
        requestAnimationFrame(() => setIsDragged(true));
        e.dataTransfer.setData('application/json', JSON.stringify({user: user, fromShift: fromShift || null}));
    };

    const onDragEnd = () => {
        setIsDragged(false);
    };

    const handleDrop = (e: React.DragEvent, shift: Shift) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {user, fromShift}: { user: User, fromShift: Shift } = JSON.parse(data);
            if (user && !sameShift(fromShift, shift)) {
                assignHandler(shift, user);
            }
        } catch (e) {
            console.error("Failed to parse data from drag event:", data, e);
        }
    };

    const assignHandler = (shift: Shift, user: User, kind: ShiftKind = 'REGULAR') => {
        // Nobody fills two roles of the same shift (the server checks too)
        const otherRole = shiftStore.otherRoleOf(shift, user.name, kind);
        if (otherRole) {
            notificationStore.showError(`המשתמש ${user.name} כבר ${shiftKindLabels[otherRole]} במשמרת הזו`);
            return;
        }
        shiftStore.assignShiftPending({
            date: shift.date,
            type: shift.type,
            assignedUsername: user.name,
            preset: shiftWeightStore.currentPresetObject,
            kind
        });
    }

    const renderExtraRoles = (shift: Shift) => {
        const extras = extraKinds
            .map(kind => shiftStore.getAssignedOrPendingShift(shift, kind))
            .filter((extra): extra is AssignedShift => !!extra);
        if (extras.length === 0) return null;
        return (
            <Box sx={cellExtrasSx}>
                {extras.map(extra => (
                    <UserCard key={extra.kind} name={extra.assignedUsername}
                              subtitle={shiftKindLabels[extra.kind ?? 'REGULAR']} isPending={extra.isPending} secondary/>
                ))}
            </Box>
        );
    }

    const extraRoleMenuItems = extraKinds.map(kind => ({
        label: `הגדר ${shiftKindLabels[kind]}`,
        icon: extraKindIcons[kind],
        action: (shift: Shift) => setExtraRoleTarget({shift, kind}),
        // Always available, so tapping a shift opens the menu instead of going straight to the regular assignment
        disabled: () => false,
    }));

    const removeExtraRoleMenuItems = extraKinds.map(kind => ({
        label: `הסר ${shiftKindLabels[kind]}`,
        icon: <DeleteOutlineRounded fontSize="small"/>,
        action: (shift: Shift) => shiftStore.unassignUser(shift, kind),
        hidden: (shift: Shift) => !shiftStore.getAssignedOrPendingShift(shift, kind),
        danger: true,
    }));

    const getUserFromShift = (shift: Shift): User | undefined => {
        const assignedUsername = shiftStore.getAssignedShift(shift)?.assignedUsername;
        return users.find(u => u.name === assignedUsername);
    }

    const getPendingOrAssignedUserFromShift = (shift: Shift): User | undefined => {
        const assignedUsername = shiftStore.getAssignedOrPendingShift(shift)?.assignedUsername;
        return users.find(u => u.name === assignedUsername);
    }

    const getPendingOrAssignedShift = (shift: Shift): AssignedShift | undefined => {
        return shiftStore.getAssignedOrPendingShift(shift);
    }

    const handleSuggestOpen = () => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        // Reservists join only when picked
        setSelectedUserIds(users.filter(u => !u.reserve).map(u => u.name));
        setSuggestDialogOpen(true);
    };
    const handleSuggestClose = () => setSuggestDialogOpen(false);
    const handleUserToggle = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };
    const handleSuggestConfirm = async () => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        const weekDates = shiftStore.weekDates;
        const startDate = weekDates[0];
        const endDate = weekDates[6];
        await shiftStore.suggestShiftAssignments(selectedUserIds, startDate, endDate);
        setSuggestDialogOpen(false);
    };

    const handleResetOpen = () => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        setResetDialogOpen(true);
    };
    const handleResetClose = () => setResetDialogOpen(false);
    const handleResetConfirm = async () => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        setResetError(false);
        const result = await shiftStore.resetWeeklyShifts();
        if (result === 'success') {
            setResetSuccess(true);
        } else {
            setResetError(true);
        }
        setResetDialogOpen(false);
    };

    const getItemName = (user: User, shift?: Shift) => {
        if (!shift || !shiftStore.getAssignedShift(shift)) return user.name;
        return user.name + ' (' + shiftStore.getAssignedOrPendingShift(shift)?.preset?.name + ')'
    }

    const getAssignmentElement = (user: User, shift: Shift) => {
        const assignedShift = getPendingOrAssignedShift(shift);
        if (!assignedShift) return <></>;
        return <Box
            sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1}}
        >
            <Box onDragStart={e => onDragStart(e, user, shift)}
                 onDragEnd={onDragEnd} draggable={authStore.isAdmin()}
            >
                <UserCard name={user.name} subtitle={assignedShift.preset.name} isPending={assignedShift.isPending}/>
            </Box>
        </Box>
    }

    return (
        <Container maxWidth={"xl"} dir={"rtl"}>
            <CalendarNavigation actions={authStore.isAdmin() ? <>
                <Button variant="contained" onClick={handleSuggestOpen} sx={suggestButtonSx}
                        disabled={shiftStore.isSuggesting} aria-busy={shiftStore.isSuggesting}
                        startIcon={shiftStore.isSuggesting ? <CircularProgress size={20} color="inherit"/> : <AutoAwesome/>}>
                    {shiftStore.isSuggesting ? 'תכף לא תשאר לנו עבודה...' : 'הצע שיבוץ שבועי'}
                </Button>
                <Button variant="outlined" color="inherit" startIcon={<Autorenew/>} onClick={handleResetOpen}
                        sx={actionButtonSx}>
                    אתחל משמרות
                </Button>
            </> : undefined}/>
            <ShiftTable onDropHandler={handleDrop}
                        isLoading={() => shiftStore.isFetchingShifts && !shiftStore.hasShiftsForCurrentWeek}
                        isWeekLoaded={offset => isInWindow(offset, shiftStore.loadedShiftsCenter)}
                        onDragStartHandler={onDragStart}
                        onDragEndHandler={onDragEnd}
                        assignHandler={assignHandler}
                        unassignHandler={shift => shiftStore.unassignUser(shift)}
                        retrievePendingItem={getPendingOrAssignedUserFromShift}
                        retrieveItemFromShift={getUserFromShift}
                        getItemName={getItemName}
                        itemList={users}
                        isPendingItems={shiftStore.pendingAssignedShifts.length > 0}
                        onSave={shiftStore.savePendingAssignments}
                        onCancel={() => shiftStore.pendingAssignedShifts = []}
                        itemName="כונן"
                        renderCellExtras={renderExtraRoles}
                        additionalContextMenuItems={[...extraRoleMenuItems, {
                            label: 'שנה פריסט',
                            action: (shift: Shift) => {
                                setSelectedShift(getPendingOrAssignedShift(shift));
                                setIsChangePresetDialogOpen(true);
                            },
                            icon: <TuneRounded fontSize="small"/>,
                            disabled: (shift: Shift) => !shiftStore.getAssignedShift(shift)
                        }, ...removeExtraRoleMenuItems]}
                        isRemoveItemDisabled={(shift: Shift) => !shiftStore.getAssignedOrPendingShift(shift)}
                        getItemElement={getAssignmentElement}
            />
            <AssignToShiftDialog
                open={extraRoleTarget !== null}
                onClose={() => setExtraRoleTarget(null)}
                shift={extraRoleTarget?.shift ?? null}
                // People already in another role of this shift can't take this one
                itemList={extraRoleTarget
                    ? users.filter(u => !shiftStore.otherRoleOf(extraRoleTarget.shift, u.name, extraRoleTarget.kind))
                    : []}
                itemTitle={extraRoleTarget ? shiftKindLabels[extraRoleTarget.kind] : ''}
                getItemName={(user: User) => user.name}
                assignFunction={(shift, user) => extraRoleTarget && assignHandler(shift, user, extraRoleTarget.kind)}
            />
            <SuggestAssignmentsDialog handleConfirm={handleSuggestConfirm}
                                      open={suggestDialogOpen}
                                      handleDialogClose={handleSuggestClose}
                                      selectedUserIds={selectedUserIds}
                                      handleUserToggle={handleUserToggle}
                                      users={users}/>
            <ResetWeeklyShiftsDialog handleConfirm={handleResetConfirm} open={resetDialogOpen}
                                     handleDialogClose={handleResetClose}/>
            <Snackbar open={resetSuccess} autoHideDuration={3000} onClose={() => setResetSuccess(false)}>
                <Alert severity="success" sx={{width: '100%'}}>כל המשמרות של השבוע אופסו בהצלחה</Alert>
            </Snackbar>
            <Snackbar open={resetError} autoHideDuration={3000} onClose={() => setResetError(false)}>
                <Alert severity="error" sx={{width: '100%'}}>אירעה שגיאה בעת איפוס המשמרות</Alert>
            </Snackbar>
            <ChangeAssignedShiftPresetDialog open={isChangePresetDialogOpen}
                                             onClose={() => setIsChangePresetDialogOpen(false)}
                                             assignedShift={selectedShift ?? {
                                                 assignedUsername: '',
                                                 date: new Date(),
                                                 type: 'יום',
                                                 preset: {name: '', weights: []}
                                             }}
            />
            <UserList isDragged={isDragged} setIsDragged={setIsDragged}/>
        </Container>
    );
});

export default AssignmentTab;
