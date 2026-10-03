import React, {useEffect, useState} from 'react';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import CommonDialog from "./CommonDialog";
import DialogTextField from "./DialogTextField";

interface PresetNameDialogProps {
    open: boolean;
    defaultValue: string;
    onClose: () => void;
    onSave: (name: string) => void;
}

const PresetNameDialog: React.FC<PresetNameDialogProps> = ({open, defaultValue, onClose, onSave}) => {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue, open]);

    return (
        <CommonDialog open={open}
                      title="שמירת פריסט"
                      icon={<SaveOutlined/>}
                      content={<DialogTextField label="שם הפריסט" value={value} autoFocus
                                                hint="שם שעוד לא קיים ייצור פריסט חדש."
                                                onChange={e => setValue(e.target.value)}/>}
                      confirmLabel="שמור"
                      disableConfirmButton={!value.trim()}
                      handleConfirm={() => onSave(value)}
                      handleDialogClose={onClose}/>
    );
};

export default PresetNameDialog;
