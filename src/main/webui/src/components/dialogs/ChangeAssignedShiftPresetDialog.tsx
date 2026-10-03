import React, {useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import TuneRounded from '@mui/icons-material/TuneRounded';
import shiftStore, {AssignedShift} from '../../stores/ShiftStore';
import shiftWeightStore from '../../stores/ShiftWeightStore';
import CommonDialog from "./CommonDialog";
import OptionGrid from "./OptionGrid";
import {formatShiftDescription} from "./AssignToShiftDialog";

interface ChangeAssignedShiftPresetProps {
    open: boolean;
    onClose: () => void;
    assignedShift: AssignedShift;
}

const ChangeAssignedShiftPresetDialog: React.FC<ChangeAssignedShiftPresetProps> = observer(({
                                                                                                open,
                                                                                                onClose,
                                                                                                assignedShift,
                                                                                            }) => {
    const [selectedPresetName, setSelectedPresetName] = useState(assignedShift.preset?.name);

    // The dialog stays mounted, so pick up the shift it was opened for
    useEffect(() => {
        if (open) setSelectedPresetName(assignedShift.preset?.name);
    }, [open, assignedShift]);

    const handleSave = () => {
        const preset = Array.from(shiftWeightStore.presets.values()).find(p => p.name === selectedPresetName);
        if (preset) shiftStore.assignShiftPending({...assignedShift, preset});
    };

    return (
        <CommonDialog open={open}
                      title="שינוי פריסט"
                      description={`${assignedShift.assignedUsername}, ${formatShiftDescription(assignedShift)}`}
                      icon={<TuneRounded/>}
                      content={<OptionGrid label="פריסט"
                                           options={Array.from(shiftWeightStore.presets.values()).map(preset => preset.name)}
                                           value={selectedPresetName}
                                           onChange={setSelectedPresetName}/>}
                      confirmLabel="שמור"
                      disableConfirmButton={!selectedPresetName || selectedPresetName === assignedShift.preset?.name}
                      handleConfirm={handleSave}
                      handleDialogClose={onClose}/>
    );
});

export default ChangeAssignedShiftPresetDialog;
