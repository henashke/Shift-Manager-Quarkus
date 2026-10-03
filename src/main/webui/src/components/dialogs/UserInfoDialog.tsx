import React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import CommonDialog from "./CommonDialog";
import {stringToColor} from "../shiftTable/ShiftTable";
import usersStore from "../../stores/UsersStore";

interface UserInfoDialogProps {
    open: boolean;
    username: string | undefined;
    onClose: () => void;
}

const UserInfoDialog: React.FC<UserInfoDialogProps> = ({open, username, onClose}) => {
    const user = usersStore.users.find(u => u.name === username);
    if (!user) return null;

    return (
        <CommonDialog open={open}
                      title="פרטי משתמש"
                      icon={<BadgeOutlined/>}
                      content={
                          <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                              <Avatar variant="rounded" sx={{
                                  width: 64,
                                  height: 64,
                                  borderRadius: 3,
                                  bgcolor: stringToColor(user.name),
                                  color: 'common.white',
                                  fontSize: '1.75rem',
                                  fontWeight: 700,
                              }}>
                                  {user.name[0].toUpperCase()}
                              </Avatar>
                              <Box sx={{flex: 1, minWidth: 0}}>
                                  <Typography sx={{fontSize: '1.25rem', fontWeight: 700}} noWrap>{user.name}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                      ניקוד <Box component="span" sx={{color: 'text.primary', fontWeight: 700}}>{user.score}</Box>
                                  </Typography>
                              </Box>
                          </Box>
                      }
                      handleDialogClose={onClose}/>
    );
};

export default UserInfoDialog;
