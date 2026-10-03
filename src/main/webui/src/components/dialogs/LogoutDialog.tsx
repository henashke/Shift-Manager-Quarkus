import React from 'react';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import CommonDialog from "./CommonDialog";

interface LogoutDialogProps {
    open: boolean;
    onClose: () => void;
    onLogout: () => void;
    username: string;
}

const LogoutDialog: React.FC<LogoutDialogProps> = ({open, onClose, onLogout, username}) => (
    <CommonDialog open={open}
                  title="התנתקות"
                  description={`להתנתק מהחשבון של ${username}?`}
                  icon={<LogoutRounded/>}
                  confirmLabel="התנתק"
                  handleConfirm={onLogout}
                  handleDialogClose={onClose}
                  danger/>
);

export default LogoutDialog;
