import React, {useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import {reaction} from 'mobx';
import CalendarNavigation from '../shiftTable/CalendarNavigation';
import DraggableList from '../draggableLists/DraggableList';
import ShiftTable from '../shiftTable/ShiftTable';
import UserCard from '../basicSharedComponents/UserCard';
import TintedCard from '../basicSharedComponents/TintedCard';
import {useTheme} from '@mui/material/styles';
import {Box, Container, Typography} from "@mui/material";
import shiftStore, {sameShift, Shift} from '../../stores/ShiftStore';
import authStore from "../../stores/AuthStore";
import {Constraint, constraintStore, ConstraintType} from "../../stores/ConstraintStore";
import usersStore from "../../stores/UsersStore";
import notificationStore from "../../stores/NotificationStore";
import NativeSelect from "../basicSharedComponents/NativeSelect";

const constraintTypes = [ConstraintType.CANT, ConstraintType.PREFERS_NOT, ConstraintType.PREFERS];

// Colors by meaning, from can't (red) to prefers (green)
const constraintPaletteKey = {
    [ConstraintType.CANT]: 'error',
    [ConstraintType.PREFERS_NOT]: 'warning',
    [ConstraintType.PREFERS]: 'success',
} as const;

const ConstraintTab: React.FC = observer(() => {
    const theme = useTheme();
    const [isDragged, setIsDragged] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string>(authStore.username || '');
    useEffect(() => {
        usersStore.fetchUsers();
    }, []);

    // A reaction, not an effect on the week read in render, so a week switch doesn't re-render the whole tab
    useEffect(() => reaction(() => shiftStore.weekOffset, offset => constraintStore.fetchConstraint(offset), {fireImmediately: true}), []);

    const onAssignedConstraintDragStart = (e: React.DragEvent, type: ConstraintType, fromShift?: Shift, username?: string) => {
        requestAnimationFrame(() => setIsDragged(true));
        setDragData(e, type, fromShift, username);
    };

    const setDragData = (e: React.DragEvent, type: ConstraintType, fromShift?: Shift, username?: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            userId: username ?? selectedUser,
            constraintType: type,
            fromShift: fromShift || null
        }));
    }

    const onDragEnd = () => {
        setIsDragged(false);
    };

    const handleShiftTableDrop = (e: React.DragEvent, shift: Shift) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {userId, constraintType, fromShift}: {
                userId: string,
                constraintType: ConstraintType,
                fromShift: Shift
            } = JSON.parse(data);
            if (userId && !sameShift(fromShift, shift)) {
                assignConstraint(shift, constraintType);
            }
        } catch (error) {
            console.error('Failed to parse data from drag event:', data, error);
        }
    };

    const handleDeleteAreaOnDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const {userId, fromShift}: {
                userId: string,
                constraintType: ConstraintType,
                fromShift: Shift
            } = JSON.parse(data);
            if (fromShift) {
                // Check if user is trying to edit their own constraints or is admin
                if (!authStore.isAdmin() && userId !== authStore.username) {
                    notificationStore.showConstraintUnauthorizedError();
                    return;
                }
                constraintStore.removeConstraint(fromShift, userId);
            }
        } catch (e) {
            console.error('Failed to parse data from drag event:', data, e);
        }
        setIsDragged(false);
    };

    const assignConstraint = (shift: Shift, constraintType: ConstraintType) => {
        if (!authStore.isAdmin() && selectedUser !== authStore.username) {
            notificationStore.showConstraintUnauthorizedError();
            return;
        }
        constraintStore.addConstraintPending({
            constraintType: constraintType,
            shift: shift,
            userId: selectedUser
        });
    }

    const isSelectedUsers = (c: Constraint, username?: string) => username === 'admin' || c.userId === username;

    const retrieveConstraintFromShift = (shift: Shift): Constraint | undefined => {
        return constraintStore.getConstraintsOfShift(shift).find(c => isSelectedUsers(c, selectedUser));
    };

    const retrieveConstraintsFromShift = (shift: Shift, username?: string): Constraint[] => {
        return constraintStore.getConstraintsOfShift(shift).concat(constraintStore.getPendingConstraintsOfShift(shift))
            .filter(c => isSelectedUsers(c, username));
    }

    const retrieveConstraintTypeFromShift = (shift: Shift): ConstraintType | undefined => {
        return retrieveConstraintFromShift(shift)?.constraintType;
    };

    const getPendingConstraintTypeFromShift = (shift: Shift): ConstraintType | undefined => {
        return getPendingConstraintFromShift(shift)?.constraintType;
    }

    const getPendingConstraintFromShift = (shift: Shift): Constraint | undefined => {
        return constraintStore.getPendingConstraintsOfShift(shift).find(c => c.userId === selectedUser);
    }

    const isRemoveItemDisabled = (shift: Shift) => !shift || !constraintStore.getConstraintsOfShift(shift)
        .concat(constraintStore.getPendingConstraintsOfShift(shift)).find(c => c.userId === selectedUser)

    const getConstraintElement = (constraintType: ConstraintType, shift: Shift) => {
        const allConstraintsOfShift = retrieveConstraintsFromShift(shift, selectedUser);
        if (allConstraintsOfShift.length === 0) return <></>;
        return <Box
            sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1}}
        >
            {allConstraintsOfShift.map(c =>
                <Box key={c.userId}
                     onDragStart={e => onAssignedConstraintDragStart(e, c.constraintType, shift, c.userId)}
                     onDragEnd={onDragEnd} draggable
                >
                    <UserCard name={c.userId} subtitle={c.constraintType} isPending={c.isPending}/>
                </Box>
            )
            }
        </Box>
    }

    const selectedUserOnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        e.target.value === '' ? setSelectedUser(authStore.username ?? '') : setSelectedUser(e.target.value)
    }

    const getUsernames = () => {
        return usersStore.users.filter(u => authStore.isAdmin() || u.name === authStore.username).map(u => u.name);
    }

    return (
        <Container maxWidth={"xl"} dir="rtl">
            <CalendarNavigation/>
            <ShiftTable itemList={constraintTypes}
                        isLoading={() => constraintStore.isFetching && !constraintStore.hasConstraintsForWeek(shiftStore.weekOffset)}
                        isWeekLoaded={offset => constraintStore.hasConstraintsForWeek(offset)}
                        defaultItem={ConstraintType.CANT}
                        retrieveItemFromShift={retrieveConstraintTypeFromShift}
                        assignHandler={assignConstraint}
                        unassignHandler={(shift: Shift) => {
                            if (!authStore.isAdmin() && selectedUser !== authStore.username) {
                                notificationStore.showConstraintUnauthorizedError();
                                return;
                            }
                            constraintStore.removeConstraint(shift, selectedUser);
                        }}
                        getItemName={(item: ConstraintType) => item.toString()}
                        retrievePendingItem={getPendingConstraintTypeFromShift}
                        onDropHandler={handleShiftTableDrop}
                        isPendingItems={constraintStore.pendingConstraints.length > 0}
                        onSave={constraintStore.savePendingConstraints}
                        onCancel={() => {
                            constraintStore.pendingConstraints = [];
                        }}
                        itemName="אילוץ"
                        requireAdmin={false}
                        isRemoveItemDisabled={isRemoveItemDisabled}
                        getItemElement={getConstraintElement}
            />
            <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2}}>
                <DraggableList
                    items={constraintTypes}
                    getKey={item => item}
                    getLabel={item => item}
                    onDragStart={setDragData}
                    onDrop={handleDeleteAreaOnDrop}
                    isDragged={isDragged}
                    renderItem={type => <TintedCard label={type} color={theme.palette[constraintPaletteKey[type]].main}/>}
                    renderAdditionalComponent={
                        <>
                            <Typography variant="h6">משבץ אילוצים עבור:</Typography>
                            <NativeSelect title={"כל המשתמשים"}
                                          options={getUsernames()}
                                          onChange={selectedUserOnChange} hideTitleElement={!authStore.isAdmin()}/>
                        </>
                    }
                />
            </Box>
        </Container>
    );
});

export default ConstraintTab;
