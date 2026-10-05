import React, {useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import {Shift} from '../../stores/ShiftStore';
import CommonDialog from "./CommonDialog";
import {formatWeekdayDayMonth} from "../../dateFormat";
import DialogSelect from "./DialogSelect";

interface AssignToShiftDialogProps<T> {
    open: boolean;
    onClose: () => void;
    shift: Shift | null;
    itemList: T[];
    defaultItem?: T;
    itemTitle: string;
    getItemName: (item: T) => string;
    assignFunction: (shift: Shift, item: T) => void;
}

export const formatShiftDescription = (shift: Shift) =>
    `משמרת ${shift.type}, ${formatWeekdayDayMonth(new Date(shift.date))}`;

function AssignToShiftDialog<T>({
                                    open,
                                    onClose,
                                    shift,
                                    itemList,
                                    defaultItem,
                                    itemTitle,
                                    getItemName,
                                    assignFunction
                                }: AssignToShiftDialogProps<T>) {
    const [selectedItem, setSelectedItem] = useState<T | undefined>(defaultItem);

    // Start every opening from the default, not from the previous pick
    useEffect(() => {
        if (open) setSelectedItem(defaultItem);
    }, [open, defaultItem]);

    if (!shift) return null;

    return (
        <CommonDialog open={open}
                      title={`שבץ ${itemTitle}`}
                      description={formatShiftDescription(shift)}
                      icon={<EventAvailableOutlined/>}
                      content={<DialogSelect label={itemTitle}
                                             options={itemList.map(getItemName)}
                                             defaultValue={defaultItem ? getItemName(defaultItem) : undefined}
                                             onChange={name => setSelectedItem(itemList.find(item => getItemName(item) === name))}/>}
                      confirmLabel="שבץ"
                      disableConfirmButton={!selectedItem}
                      handleConfirm={() => selectedItem && assignFunction(shift, selectedItem)}
                      handleDialogClose={onClose}/>
    );
}

export default observer(AssignToShiftDialog) as typeof AssignToShiftDialog;
