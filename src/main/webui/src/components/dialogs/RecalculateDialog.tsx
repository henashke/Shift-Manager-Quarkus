import React from 'react';
import CalculateOutlined from '@mui/icons-material/CalculateOutlined';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";

type RecalculateDialogProps = Pick<CommonDialogProps, 'open' | 'handleDialogClose' | 'handleConfirm'>;

const RecalculateDialog: React.FC<RecalculateDialogProps> = ({open, handleDialogClose, handleConfirm}) => (
    <CommonDialog open={open}
                  title="חישוב ניקוד מחדש"
                  description="הניקוד של כל המשתמשים יחושב מחדש לפי המשמרות שלהם."
                  icon={<CalculateOutlined/>}
                  confirmLabel="חשב מחדש"
                  handleConfirm={handleConfirm}
                  handleDialogClose={handleDialogClose}
                  danger/>
);

export default RecalculateDialog;
