import React, {useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import {useNavigate} from 'react-router-dom';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import CommonDialog from './CommonDialog';
import announcementStore from '../../stores/AnnouncementStore';
import authStore from '../../stores/AuthStore';
import {formatPaddedDate} from '../../dateFormat';

interface AnnouncementBrowserDialogProps {
    open: boolean;
    onClose: () => void;
}

const navSx = {display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 2} as const;
const navButtonSx = {width: 40, height: 40, borderRadius: 2, border: '1px solid', borderColor: 'divider'} as const;
const counterSx = {textAlign: 'center', fontVariantNumeric: 'tabular-nums'} as const;

const parseDay = (date: string) => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d);
};

// Every "what's new" announcement, newest first, one at a time with previous / next (wrapping around). Opened from
// settings; an announcement seen here won't pop up again.
const AnnouncementBrowserDialog: React.FC<AnnouncementBrowserDialogProps> = observer(({open, onClose}) => {
    const navigate = useNavigate();
    const list = announcementStore.all;
    const [index, setIndex] = useState(0);
    const announcement = list[Math.min(index, list.length - 1)];

    // Starts from the newest each time it opens
    useEffect(() => {
        if (open) setIndex(0);
    }, [open]);

    useEffect(() => {
        if (open && announcement) announcementStore.markSeen(announcement.id);
    }, [open, announcement]);

    if (!announcement) return null;
    const step = (by: number) => setIndex(i => (i + by + list.length) % list.length);
    const {action} = announcement;

    return (
        <CommonDialog open={open}
                      title={announcement.title}
                      description={announcement.description}
                      icon={announcement.icon}
                      content={<>
                          {announcement.content(authStore.isAdmin())}
                          {list.length > 1 ? (
                              <Box sx={navSx}>
                                  {/* RTL: the previous (newer) one is on the right */}
                                  <IconButton sx={navButtonSx} onClick={() => step(-1)} aria-label="הפיצ׳ר הקודם">
                                      <ChevronRight/>
                                  </IconButton>
                                  <Box sx={counterSx}>
                                      <Typography variant="body2" sx={{fontWeight: 600}}>
                                          {index + 1} מתוך {list.length}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                          נוסף ב־{formatPaddedDate(parseDay(announcement.date))}
                                      </Typography>
                                  </Box>
                                  <IconButton sx={navButtonSx} onClick={() => step(1)} aria-label="הפיצ׳ר הבא">
                                      <ChevronLeft/>
                                  </IconButton>
                              </Box>
                          ) : null}
                      </>}
                      confirmLabel={action?.label}
                      hideCancel
                      handleConfirm={action ? () => navigate(action.path, {state: action.state}) : undefined}
                      handleDialogClose={onClose}/>
    );
});

export default AnnouncementBrowserDialog;
