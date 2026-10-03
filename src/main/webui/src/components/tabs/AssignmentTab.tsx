import React, {useEffect, useState} from 'react';
import CalendarNavigation from '../shiftTable/CalendarNavigation';
import ShiftTable from '../shiftTable/ShiftTable';
import UserCard from '../basicSharedComponents/UserCard';
import UserList from '../draggableLists/UserList';
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Snackbar from "@mui/material/Snackbar";
import {SxProps, Theme} from "@mui/material/styles";
import usersStore from "../../stores/UsersStore";
import {observer} from 'mobx-react-lite';
import shiftStore, {AssignedShift, sameShift, Shift, User} from "../../stores/ShiftStore";
import authStore from "../../stores/AuthStore";
import notificationStore from "../../stores/NotificationStore";
import shiftWeightStore from "../../stores/ShiftWeightStore";
import ChangeAssignedShiftPresetDialog from '../dialogs/ChangeAssignedShiftPresetDialog';
import Autorenew from '@mui/icons-material/Autorenew';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import ResetWeeklyShiftsDialog from "../dialogs/ResetWeeklyShiftsDialog";
import SuggestAssignmentsDialog from "../dialogs/SuggestAssignmentsDialog";

// MUI's startIcon margins don't flip without an RTL style plugin, so space the icon with gap instead
const actionButtonSx = {
    flex: 1,
    maxWidth: 280,
    py: 1.25,
    gap: 1,
    borderRadius: 2,
    fontWeight: 700,
    '& .MuiButton-startIcon': {m: 0},
} as const;

const suggestButtonSx: SxProps<Theme> = {
    ...actionButtonSx,
    background: theme => `linear-gradient(90deg, ${theme.palette.primary.main}, #8b5cf6)`,
};

const resetButtonSx: SxProps<Theme> = {...actionButtonSx, borderColor: 'divider'};

const AssignmentTab: React.FC = observer(() => {
    const {users} = usersStore;
    const [isDragged, setIsDragged] = useState(false);
    const [isChangePresetDialogOpen, setIsChangePresetDialogOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<AssignedShift | undefined>(undefined);
    const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetError, setResetError] = useState(false);

    useEffect(() => {
        shiftWeightStore.fetchPresets();
        usersStore.fetchUsers();
        shiftStore.fetchShifts();
    }, []);

    useEffect(() => {
        setSelectedUserIds(users.map(u => u.name));
    }, [users]);

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

    const assignHandler = (shift: Shift, user: User) => {
        shiftStore.assignShiftPending({
            ...shift,
            assignedUsername: user.name,
            preset: shiftWeightStore.currentPresetObject
        });
    }

    const getUserFromShift = (shift: Shift): User | undefined => {
        return users.find(u => shiftStore.getAssignedShift(shift)?.assignedUsername === u.name);
    }

    const getPendingOrAssignedUserFromShift = (shift: Shift): User | undefined => {
        return users.find(u => u.name === shiftStore.pendingAssignedShifts.concat(shiftStore.assignedShifts).find(assignedShift => sameShift(assignedShift, shift))?.assignedUsername)
    }

    const getPendingOrAssignedShift = (shift: Shift): AssignedShift | undefined => {
        return shiftStore.pendingAssignedShifts.concat(shiftStore.assignedShifts).find(assignedShift => sameShift(assignedShift, shift))
    }

    const handleSuggestOpen = () => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
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
                 onDragEnd={onDragEnd} draggable
            >
                <UserCard name={user.name} shiftType={assignedShift.preset.name} isPending={assignedShift.isPending}/>
            </Box>
        </Box>
    }

    return (
        <Container maxWidth={"xl"} dir={"rtl"}>
            <CalendarNavigation actions={authStore.isAdmin() ? <>
                <Button variant="contained" startIcon={<AutoAwesome/>} onClick={handleSuggestOpen}
                        sx={suggestButtonSx}>
                    הצע שיבוץ שבועי
                </Button>
                <Button variant="outlined" color="inherit" startIcon={<Autorenew/>} onClick={handleResetOpen}
                        sx={resetButtonSx}>
                    אתחל משמרות
                </Button>
            </> : undefined}/>
            <ShiftTable onDropHandler={handleDrop}
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
                        additionalContextMenuItems={[{
                            label: 'שנה פריסט',
                            action: (shift: Shift) => {
                                setSelectedShift(getPendingOrAssignedShift(shift));
                                setIsChangePresetDialogOpen(true);
                            },
                            icon: <SwapHoriz color={'primary'}/>,
                            disabled: (shift: Shift) => !shiftStore.getAssignedShift(shift)
                        }]}
                        isRemoveItemDisabled={(shift: Shift) => !shiftStore.getAssignedOrPendingShift(shift)}
                        getItemElement={getAssignmentElement}
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
