import React from 'react';
import {observer} from 'mobx-react-lite';
import CommonDialog from './CommonDialog';
import announcementStore from '../../stores/AnnouncementStore';
import authStore from '../../stores/AuthStore';

// Shows the user's next unseen "what's new" announcement; closing it in any way counts as seen
const AnnouncementDialog: React.FC = observer(() => {
    const announcement = announcementStore.current;
    if (!announcement) return null;
    const dismiss = () => announcementStore.markSeen(announcement.id);

    return (
        <CommonDialog key={announcement.id}
                      open
                      title={announcement.title}
                      description={announcement.description}
                      icon={announcement.icon}
                      content={announcement.content(authStore.isAdmin())}
                      confirmLabel={announcement.confirmLabel ?? 'הבנתי'}
                      hideCancel
                      handleConfirm={dismiss}
                      handleDialogClose={dismiss}/>
    );
});

export default AnnouncementDialog;
