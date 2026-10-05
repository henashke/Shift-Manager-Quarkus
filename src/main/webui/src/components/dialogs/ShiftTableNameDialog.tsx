import React, {useEffect, useState} from 'react';
import TableChartOutlined from '@mui/icons-material/TableChartOutlined';
import CommonDialog, {CommonDialogProps} from './CommonDialog';
import DialogTextField from './DialogTextField';
import shiftStore, {MAX_TABLE_NAME_LENGTH, REGULAR_TABLE_LABEL} from '../../stores/ShiftStore';

interface ShiftTableNameDialogProps extends Pick<CommonDialogProps, 'open' | 'handleDialogClose'> {
    title: string;
    description: string;
    confirmLabel: string;
    // The table's current name when renaming
    currentName?: string;
    onSave: (name: string) => void;
}

// Names a week's extra table, for creating or renaming it
const ShiftTableNameDialog: React.FC<ShiftTableNameDialogProps> = ({open, handleDialogClose, title, description,
                                                                       confirmLabel, currentName, onSave}) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (open) setName(currentName ?? '');
    }, [open, currentName]);

    const trimmed = name.trim();
    const problem = trimmed === REGULAR_TABLE_LABEL ? 'השם הזה שמור לטבלה הרגילה'
        : trimmed !== currentName && shiftStore.tablesForCurrentWeek.includes(trimmed) ? 'כבר יש השבוע טבלה בשם הזה'
            : trimmed.length > MAX_TABLE_NAME_LENGTH ? `עד ${MAX_TABLE_NAME_LENGTH} תווים`
                : undefined;

    return (
        <CommonDialog open={open}
                      title={title}
                      description={description}
                      icon={<TableChartOutlined/>}
                      content={<DialogTextField label="שם הטבלה" value={name} autoFocus
                                                onChange={e => setName(e.target.value)}
                                                error={!!problem} hint={problem}/>}
                      confirmLabel={confirmLabel}
                      disableConfirmButton={trimmed === '' || trimmed === currentName || !!problem}
                      handleConfirm={() => onSave(trimmed)}
                      handleDialogClose={handleDialogClose}/>
    );
};

export default ShiftTableNameDialog;
