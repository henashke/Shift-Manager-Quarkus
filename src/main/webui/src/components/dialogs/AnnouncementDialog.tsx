import React from 'react';
import {observer} from 'mobx-react-lite';
import {useNavigate} from 'react-router-dom';
import CommonDialog from './CommonDialog';
import announcementStore from '../../stores/AnnouncementStore';
import authStore from '../../stores/AuthStore';

// Shows the user's next unseen "what's new" announcement; closing it in any way counts as seen
const AnnouncementDialog: React.FC = observer(() => {
    const navigate = useNavigate();
    const announcement = announcementStore.current;
    if (!announcement) return null;
    const dismiss = () => announcementStore.markSeen(announcement.id);
    const {action} = announcement;
    const confirm = action ? () => {
        dismiss();
        navigate(action.path, {state: action.state});
    } : dismiss;

    return (
        <CommonDialog key={announcement.id}
                      open
                      title={announcement.title}
                      description={announcement.description}
                      icon={announcement.icon}
                      content={announcement.content(authStore.isAdmin())}
                      confirmLabel={action?.label ?? announcement.confirmLabel ?? 'הבנתי'}
                      cancelLabel="אחר כך"
                      hideCancel={!action}
                      handleConfirm={confirm}
                      handleDialogClose={dismiss}/>
    );
});

export default AnnouncementDialog;
