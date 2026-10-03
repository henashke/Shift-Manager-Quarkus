import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import {alpha} from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';

interface DraggableListProps<T> {
    items: T[];
    getKey: (item: T) => string;
    getLabel: (item: T) => string;
    onDragStart: (e: React.DragEvent, item: T) => void;
    onDrop?: (e: React.DragEvent) => void;
    contextMenuItems?: (item: T, close: () => void) => { label: string, onClick: () => void }[];
    onItemClick?: (item: T) => void;
    renderAdditionalComponent?: JSX.Element;
    isDragged?: boolean;
    renderItem?: (item: T) => JSX.Element;
    // Drops the card background, for when the list sits inside another surface (e.g. BottomTray)
    embedded?: boolean;
}

const embeddedSx = {bgcolor: 'transparent', backgroundImage: 'none'};

function DraggableList<T>({
                              items,
                              getKey,
                              getLabel,
                              onDragStart,
                              onDrop,
                              contextMenuItems,
                              renderAdditionalComponent,
                              isDragged,
                              renderItem,
                              embedded
                          }: DraggableListProps<T>) {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedItem, setSelectedItem] = useState<T | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>, item: T) => {
        event.preventDefault();
        setSelectedItem(item);
        setMenuAnchor(event.currentTarget);
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (onDrop) {
            e.preventDefault();
            setIsDragOver(true);
        }
    };
    const handleDragLeave = () => {
        setIsDragOver(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        setIsDragOver(false);
        if (onDrop) onDrop(e);
    };

    return (
        <Paper elevation={embedded ? 0 : 1}
               sx={{p: 2, borderRadius: 2, position: 'relative', flexGrow: 1, ...(embedded ? embeddedSx : {})}}>
            <>
                <Box sx={{
                    display: 'flex',
                    gap: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    {renderAdditionalComponent}
                    <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center" justifySelf={'center'}
                         alignSelf={'center'}>
                        {items.map(item => (
                            <Box
                                key={getKey(item)}
                                draggable
                                onDragStart={e => onDragStart(e, item)}
                                onClick={contextMenuItems ? e => handleContextMenu(e, item) : undefined}
                                onContextMenu={contextMenuItems ? e => handleContextMenu(e, item) : undefined}
                                sx={renderItem ? {
                                    cursor: 'grab',
                                    transition: 'transform 0.2s',
                                    '&:active': {transform: 'scale(0.97)'},
                                    '&:hover': {transform: 'scale(1.04)', cursor: 'pointer'},
                                } : {
                                    background: theme => theme.palette.primary.main,
                                    color: 'common.white',
                                    px: 3,
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    fontSize: '1.08em',
                                    cursor: 'grab',
                                    boxShadow: 2,
                                    userSelect: 'none',
                                    transition: 'box-shadow 0.2s, transform 0.2s',
                                    '&:active': {
                                        background: theme => theme.palette.primary.dark,
                                        color: 'common.white',
                                        boxShadow: 4,
                                        transform: 'scale(0.97)',
                                    },
                                    '&:hover': {
                                        boxShadow: 6,
                                        transform: 'scale(1.04)',
                                        cursor: 'pointer',
                                    },
                                }}
                            >
                                {renderItem ? renderItem(item) : getLabel(item)}
                            </Box>
                        ))}
                    </Box>
                </Box>
                <Box
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        height: 180,
                        border: '2px dashed',
                        borderColor: isDragOver ? 'error.main' : 'divider',
                        bgcolor: theme => isDragOver ? alpha(theme.palette.error.main, 0.22) : theme.palette.background.paper,
                        borderRadius: 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        display: isDragged && onDrop ? 'flex' : 'none',
                        color: isDragOver ? 'error.light' : 'text.secondary',
                        transition: 'all 0.2s',
                        minHeight: 64,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '1.1em',
                    }}
                >
                    <DeleteIcon sx={{mr: 1, color: isDragOver ? 'error.main' : 'inherit', fontSize: 40}}/>
                    {isDragOver ? 'שחרר כדי למחוק' : "גרור לכאן כדי למחוק"}
                </Box>
            </>
            {contextMenuItems && selectedItem && (
                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                    {contextMenuItems(selectedItem, () => setMenuAnchor(null)).map((menu, idx) => (
                        <MenuItem key={idx} onClick={() => {
                            menu.onClick();
                            setMenuAnchor(null);
                        }}>{menu.label}</MenuItem>
                    ))}
                </Menu>
            )}
        </Paper>
    );
}

export default DraggableList;
