import React, {useEffect, useState} from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';
import {observer} from 'mobx-react-lite';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";
import DialogTextField from "./DialogTextField";
import authStore from "../../stores/AuthStore";
import notificationStore from "../../stores/NotificationStore";
import usersStore from "../../stores/UsersStore";
import shiftStore from "../../stores/ShiftStore";
import {constraintStore} from "../../stores/ConstraintStore";

// The signed-in user changes their own name and/or password
const AccountDialog: React.FC<Pick<CommonDialogProps, 'open' | 'handleDialogClose'>> = observer(({open, handleDialogClose}) => {
    const currentName = authStore.username ?? '';
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Start fresh on every opening
    useEffect(() => {
        if (!open) return;
        setUsername(authStore.username ?? '');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
        setError(null);
    }, [open]);

    const trimmedName = username.trim();
    const renames = trimmedName !== '' && trimmedName !== currentName;
    const changesPassword = newPassword !== '';
    const passwordsMismatch = confirmPassword !== '' && confirmPassword !== newPassword;
    const canSave = !saving && (renames || changesPassword) && trimmedName !== '' && currentPassword !== ''
        && (!changesPassword || confirmPassword === newPassword);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        const failure = await authStore.updateAccount({
            username: renames ? trimmedName : undefined,
            newPassword: changesPassword ? newPassword : undefined,
            currentPassword,
        });
        setSaving(false);
        if (failure) {
            setError(failure);
            return;
        }
        if (renames) {
            // Users, shifts and constraints all show the old name until fetched again
            usersStore.fetchUsers();
            shiftStore.fetchShifts();
            constraintStore.fetchConstraint(shiftStore.weekOffset);
        }
        notificationStore.showSuccess(changesPassword ? 'החשבון עודכן. שאר המכשירים נותקו' : 'החשבון עודכן');
        handleDialogClose();
    };

    return (
        <CommonDialog open={open}
                      title="החשבון שלי"
                      description="שינוי שם המשתמש או הסיסמה. כדי לשמור יש להזין את הסיסמה הנוכחית."
                      icon={<ManageAccountsOutlined/>}
                      content={
                          <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                              {error ? <Alert severity="error" sx={{borderRadius: 2.5}}>{error}</Alert> : null}
                              <DialogTextField label="שם משתמש" value={username} autoComplete="username"
                                               onChange={e => setUsername(e.target.value)}
                                               error={trimmedName === ''}/>
                              <DialogTextField label="סיסמה חדשה" type="password" value={newPassword}
                                               autoComplete="new-password" hint="השאירו ריק כדי לא לשנות"
                                               onChange={e => setNewPassword(e.target.value)}/>
                              {changesPassword ? (
                                  <DialogTextField label="אימות סיסמה חדשה" type="password" value={confirmPassword}
                                                   autoComplete="new-password" error={passwordsMismatch}
                                                   hint={passwordsMismatch ? 'הסיסמאות לא תואמות' : undefined}
                                                   onChange={e => setConfirmPassword(e.target.value)}/>
                              ) : null}
                              <DialogTextField label="סיסמה נוכחית" type="password" value={currentPassword}
                                               autoComplete="current-password"
                                               onChange={e => setCurrentPassword(e.target.value)}/>
                          </Box>
                      }
                      confirmLabel={saving ? 'שומר...' : 'שמור'}
                      disableConfirmButton={!canSave}
                      closeOnConfirm={false}
                      handleConfirm={handleSave}
                      handleDialogClose={handleDialogClose}/>
    );
});

export default AccountDialog;
