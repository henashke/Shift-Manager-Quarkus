import React, {useState} from 'react';
import {observer} from 'mobx-react-lite';
import usersStore from '../../stores/UsersStore';
import shiftStore, {Shift, User} from '../../stores/ShiftStore';
import DeleteUserDialog from "../dialogs/DeleteUserDialog";
import UserInfoDialog from "../dialogs/UserInfoDialog";
import DraggableList from './DraggableList';
import UserCard from '../basicSharedComponents/UserCard';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import MilitaryTechOutlined from '@mui/icons-material/MilitaryTechOutlined';
import UndoRounded from '@mui/icons-material/UndoRounded';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import RemoveModeratorOutlined from '@mui/icons-material/RemoveModeratorOutlined';
import BottomTray from '../basicSharedComponents/BottomTray';
import useMediaQuery from '@mui/material/useMediaQuery';
import {useTheme} from '@mui/material/styles';
import EditUser from "../dialogs/EditUser";
import authStore from "../../stores/AuthStore";
import notificationStore from "../../stores/NotificationStore";
import {ContextMenuItem} from "./DraggableList";

const UserList: React.FC<{ isDragged?: boolean, setIsDragged?: (val: boolean) => void }> = observer(({ isDragged, setIsDragged }) => {
    const {users} = usersStore;
    const regularUsers = users.filter(u => !u.reserve);
    const reserveUsers = users.filter(u => u.reserve);
    const theme = useTheme();
    // Same breakpoint where the shift table switches to its vertical layout
    const isNarrowScreen = useMediaQuery(theme.breakpoints.down('md'), {noSsr: true});
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUserName, setSelectedUserName] = useState<string | undefined>(undefined);
    const [infoDialogOpen, setInfoDialogOpen] = useState(false);

    const deleteAreaOnDropHandler = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {fromShift}: { user: User, fromShift: Shift } = JSON.parse(data);
            if (fromShift) {
                shiftStore.unassignUser(fromShift);
            }
        } catch (e) {
            console.error("Error: " + e);
        }
        if (setIsDragged) setIsDragged(false);
    };
    const onDragStart = (e: React.DragEvent, user: User) => {
        e.dataTransfer.setData('application/json', JSON.stringify({user: user}));
    };
    const handleEditDialogOpen = (user: User) => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        setSelectedUserName(user.name);
        setEditDialogOpen(true);
    };

    const handleInfoDialogOpen = (user: User) => {
        setSelectedUserName(user.name);
        setInfoDialogOpen(true);
    };

    const handleDeleteDialogOpen = (user: User) => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        setSelectedUserName(user.name);
        setDeleteDialogOpen(true);
    };

    const handleDeleteDialogClose = () => {
        setDeleteDialogOpen(false);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (!selectedUserName) {
            handleDeleteDialogClose();
            return;
        }
        try {
            await usersStore.deleteUser(selectedUserName);
            notificationStore.showSuccess('המשתמש נמחק בהצלחה');
        } catch (e) {
            notificationStore.showError('מחיקת המשתמש נכשלה');
        } finally {
            handleDeleteDialogClose();
            setSelectedUserName(undefined);
        }
    };

    const runAdminAction = (action: () => Promise<void>) => {
        if (!authStore.isAdmin()) {
            notificationStore.showUnauthorizedError();
            return;
        }
        action();
    };

    // Reserve and role actions, for admins only; nobody changes their own role
    const adminMenuItems = (user: User): ContextMenuItem[] => {
        if (!authStore.isAdmin()) return [];
        const items: ContextMenuItem[] = [user.reserve
            ? {label: 'החזר לכוננים קבועים', icon: <UndoRounded fontSize="small"/>,
                onClick: () => runAdminAction(() => usersStore.setReserve(user.name, false))}
            : {label: 'העבר למילואים', icon: <MilitaryTechOutlined fontSize="small"/>,
                onClick: () => runAdminAction(() => usersStore.setReserve(user.name, true))}];
        if (user.name !== authStore.username) {
            items.push(user.role === 'admin'
                ? {label: 'הסר הרשאות מנהל', icon: <RemoveModeratorOutlined fontSize="small"/>,
                    onClick: () => runAdminAction(() => usersStore.setRole(user.name, 'user'))}
                : {label: 'הפוך למנהל', icon: <AdminPanelSettingsOutlined fontSize="small"/>,
                    onClick: () => runAdminAction(() => usersStore.setRole(user.name, 'admin'))});
        }
        return items;
    };

    const userList = <DraggableList
        items={regularUsers}
        secondaryItems={reserveUsers}
        secondaryLabel="מילואים"
        getKey={u => u.name}
        getLabel={u => u.name}
        onDragStart={onDragStart}
        onDrop={deleteAreaOnDropHandler}
        onItemClick={(user) => handleInfoDialogOpen(user)}
        contextMenuItems={(user) => [
            {label: 'פרטי משתמש', icon: <BadgeOutlined fontSize="small"/>, onClick: () => handleInfoDialogOpen(user)},
            {label: 'ערוך', icon: <EditOutlined fontSize="small"/>, onClick: () => handleEditDialogOpen(user)},
            ...adminMenuItems(user),
            {label: 'מחק', icon: <DeleteOutlineRounded fontSize="small"/>, danger: true, onClick: () => handleDeleteDialogOpen(user)},
        ]}
        isDragged={isDragged}
        embedded={isNarrowScreen}
        renderItem={u => <UserCard name={u.name}/>}
    />;

    return (
        <>
            {isNarrowScreen ? (
                <BottomTray title="כוננים" names={regularUsers.map(u => u.name)} forceOpen={isDragged}>
                    {userList}
                </BottomTray>
            ) : userList}
            <EditUser open={editDialogOpen}
                       handleDialogClose={handleEditDialogClose}
                      username={selectedUserName}/>
            <DeleteUserDialog
                open={deleteDialogOpen}
                handleDialogClose={handleDeleteDialogClose}
                handleConfirm={handleConfirmDelete}
                selectedUsername={selectedUserName}/>
            <UserInfoDialog open={infoDialogOpen} username={selectedUserName} onClose={() => setInfoDialogOpen(false)}/>
        </>
    );
});

export default UserList;
