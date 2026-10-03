import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import {alpha} from '@mui/material/styles';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import CheckRounded from '@mui/icons-material/CheckRounded';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";
import {User} from "../../stores/ShiftStore";
import {stringToColor} from "../shiftTable/ShiftTable";

interface SuggestAssignmentsDialogProps extends Pick<CommonDialogProps, 'open' | 'handleDialogClose'> {
    handleConfirm: () => void;
    handleUserToggle: (userId: string) => void;
    selectedUserIds: string[];
    users: User[];
}

const SuggestAssignmentsDialog: React.FC<SuggestAssignmentsDialogProps> = ({
                                                                               open,
                                                                               handleDialogClose,
                                                                               handleConfirm,
                                                                               handleUserToggle,
                                                                               selectedUserIds,
                                                                               users
                                                                           }) => {
    const allSelected = users.every(user => selectedUserIds.includes(user.name));
    const toggleAll = () => users
        .filter(user => selectedUserIds.includes(user.name) === allSelected)
        .forEach(user => handleUserToggle(user.name));

    return (
        <CommonDialog open={open}
                      title="הצעת שיבוץ שבועי"
                      description="בחר את הכוננים שישתתפו בשיבוץ."
                      icon={<AutoAwesome/>}
                      content={
                          <>
                              <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1}}>
                                  <Typography variant="body2" color="text.secondary">
                                      נבחרו {selectedUserIds.length} מתוך {users.length}
                                  </Typography>
                                  <Button size="small" onClick={toggleAll} sx={{fontWeight: 600}}>
                                      {allSelected ? 'נקה הכל' : 'בחר הכל'}
                                  </Button>
                              </Box>
                              <Box sx={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: 1}}>
                                  {users.map(user => {
                                      const selected = selectedUserIds.includes(user.name);
                                      const color = stringToColor(user.name);
                                      return (
                                          <ButtonBase key={user.name} role="checkbox" aria-checked={selected}
                                                      onClick={() => handleUserToggle(user.name)}
                                                      sx={{
                                                          justifyContent: 'flex-start',
                                                          gap: 1,
                                                          px: 1.5,
                                                          py: 1.25,
                                                          borderRadius: 2.5,
                                                          border: '1px solid',
                                                          borderColor: selected ? alpha(color, 0.7) : 'divider',
                                                          bgcolor: selected ? alpha(color, 0.14) : 'transparent',
                                                          color: selected ? 'text.primary' : 'text.secondary',
                                                          fontWeight: 600,
                                                          transition: 'background-color 150ms, border-color 150ms, color 150ms',
                                                          '&.Mui-focusVisible': {outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2},
                                                      }}>
                                              <Box sx={{
                                                  width: 18,
                                                  height: 18,
                                                  flexShrink: 0,
                                                  display: 'grid',
                                                  placeItems: 'center',
                                                  borderRadius: 1,
                                                  border: '2px solid',
                                                  borderColor: selected ? color : 'text.disabled',
                                                  bgcolor: selected ? color : 'transparent',
                                                  color: 'common.white',
                                              }}>
                                                  {selected ? <CheckRounded sx={{fontSize: 14}}/> : null}
                                              </Box>
                                              <Box component="span" sx={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                                  {user.name}
                                              </Box>
                                          </ButtonBase>
                                      );
                                  })}
                              </Box>
                          </>
                      }
                      confirmLabel="הצע שיבוץ"
                      disableConfirmButton={selectedUserIds.length === 0}
                      handleConfirm={handleConfirm}
                      handleDialogClose={handleDialogClose}/>
    );
}

export default SuggestAssignmentsDialog;
