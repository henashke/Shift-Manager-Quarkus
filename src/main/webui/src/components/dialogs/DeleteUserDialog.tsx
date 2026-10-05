import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import MilitaryTechOutlined from '@mui/icons-material/MilitaryTechOutlined';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";

interface DeleteUserProps extends Pick<CommonDialogProps, 'open' | 'handleDialogClose'> {
    selectedUsername?: string;
    handleConfirm: () => void;
    // The safer alternative, offered when the user isn't a reservist already
    onMoveToReserve?: () => void;
}

const DeleteUserDialog: React.FC<DeleteUserProps> = ({open, handleDialogClose, handleConfirm, selectedUsername, onMoveToReserve}) => (
    <CommonDialog open={open}
                  title={`מחיקת ${selectedUsername ?? ''}`}
                  description="המשתמש יימחק מהמערכת לצמיתות."
                  icon={<DeleteOutlineRounded/>}
                  content={onMoveToReserve ? (
                      <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                          <Typography variant="body2" color="text.secondary">
                              כדי לשמור את המשמרות, האילוצים והניקוד שלו, אפשר להעביר אותו למילואים במקום.
                          </Typography>
                          <Button variant="contained" startIcon={<MilitaryTechOutlined/>} sx={{py: 1.1}}
                                  onClick={() => {
                                      onMoveToReserve();
                                      handleDialogClose();
                                  }}>
                              העבר למילואים במקום
                          </Button>
                      </Box>
                  ) : undefined}
                  confirmLabel="מחק"
                  handleConfirm={handleConfirm}
                  handleDialogClose={handleDialogClose}
                  danger/>
);

export default DeleteUserDialog;
