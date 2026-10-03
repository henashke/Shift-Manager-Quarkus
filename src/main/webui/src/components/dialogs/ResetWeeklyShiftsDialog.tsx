import React from 'react';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";

type ResetWeeklyShiftsDialogProps = Pick<CommonDialogProps, 'open' | 'handleDialogClose' | 'handleConfirm'>;

const ResetWeeklyShiftsDialog: React.FC<ResetWeeklyShiftsDialogProps> = ({open, handleDialogClose, handleConfirm}) => (
    <CommonDialog open={open}
                  title="איפוס משמרות השבוע"
                  description="כל המשמרות של השבוע המוצג יימחקו."
                  icon={<RestartAltRounded/>}
                  confirmLabel="אפס משמרות"
                  handleConfirm={handleConfirm}
                  handleDialogClose={handleDialogClose}
                  danger/>
);

export default ResetWeeklyShiftsDialog;
