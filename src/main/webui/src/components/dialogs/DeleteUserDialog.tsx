import React from 'react';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";

interface DeleteUserProps extends Pick<CommonDialogProps, 'open' | 'handleDialogClose'> {
    selectedUsername?: string;
    handleConfirm: () => void;
}

const DeleteUserDialog: React.FC<DeleteUserProps> = ({open, handleDialogClose, handleConfirm, selectedUsername}) => (
    <CommonDialog open={open}
                  title={`מחיקת ${selectedUsername ?? ''}`}
                  description="המשתמש יוסר מהמערכת."
                  icon={<DeleteOutlineRounded/>}
                  confirmLabel="מחק"
                  handleConfirm={handleConfirm}
                  handleDialogClose={handleDialogClose}
                  danger/>
);

export default DeleteUserDialog;
