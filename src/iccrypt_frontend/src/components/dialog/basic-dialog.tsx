import * as React from 'react';
import {ReactElement} from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export interface BasicDialogProps {
    title: string;
    leadText: string;
    isOpen: boolean;
    handleClose: () => void;
    cancelAction: () => void;
    okAction: () => void;
    okButtonText: string;
    children: ReactElement;
    error: string;
}

export const BasicDialog = ({ title, leadText, isOpen, handleClose, cancelAction, okAction, okButtonText, children}: BasicDialogProps) => {

return (
    <Dialog open={isOpen} onClose={handleClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
            <DialogContentText>{leadText}</DialogContentText>
            {children}
        </DialogContent>
        <DialogActions>
            <Button onClick={cancelAction}>Cancel</Button>
            <Button onClick={okAction}>{okButtonText}</Button>
        </DialogActions>
    </Dialog>
);
}
