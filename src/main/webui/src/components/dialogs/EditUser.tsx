import React, {useEffect, useState} from 'react';
import EditOutlined from '@mui/icons-material/EditOutlined';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";
import DialogTextField from "./DialogTextField";
import usersStore from "../../stores/UsersStore";

interface EditUserProps extends Pick<CommonDialogProps, 'open' | 'handleDialogClose'> {
    username?: string;
}

const EditUser: React.FC<EditUserProps> = ({open, handleDialogClose, username}) => {
    const user = usersStore.users.find(u => u.name === username);
    const [newScore, setNewScore] = useState('');

    // Load the user's current score on every opening, so confirming without typing keeps it
    useEffect(() => {
        if (open) setNewScore(user?.score?.toString() ?? '0');
    }, [open, user]);

    const isValidScore = newScore.trim() !== '' && !Number.isNaN(Number(newScore));

    const handleConfirmEdit = () => {
        if (user && isValidScore) {
            usersStore.editUser({...user, score: Number(newScore)});
        }
    };

    return (
        <CommonDialog open={open}
                      title={`עריכת ${user?.name ?? ''}`}
                      icon={<EditOutlined/>}
                      content={<DialogTextField label="ניקוד" type="number" value={newScore} autoFocus
                                                onChange={e => setNewScore(e.target.value)}/>}
                      confirmLabel="שמור"
                      disableConfirmButton={!isValidScore}
                      handleConfirm={handleConfirmEdit}
                      handleDialogClose={handleDialogClose}/>
    );
}

export default EditUser;
