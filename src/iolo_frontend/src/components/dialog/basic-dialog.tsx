import * as React from 'react';
import {ReactElement} from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {CircularProgress} from "@mui/material";
import {Error} from "../error/error";
import './basic-dialog.css';
import {useTranslation} from "react-i18next";

export interface BasicDialogProps {
    title: string;
    leadText: string | ReactElement;
    isOpen: boolean;
    handleClose: () => void;
    cancelAction?: () => void;
    okAction?: () => void;
    okButtonText?: string;
    children?: ReactElement | never[];
    error: string;
    dialogItemState: string;
}

export const BasicDialog = ({title, leadText, isOpen, handleClose, cancelAction, okAction, okButtonText, children, error, dialogItemState}: BasicDialogProps) => {

    const { t } = useTranslation();
    const loading = dialogItemState === 'pending';

    return (
        <Dialog open={isOpen} onClose={handleClose}>
            {loading && <div className="popup-loading"><div className="popup-loader"><CircularProgress color="secondary"/></div></div>}
            <DialogTitle className="popup-title">{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{leadText}</DialogContentText>
                {error &&
                    <Error error={error}/>
                }
                {!error &&
                    <>{children}</>
                }
            </DialogContent>
            <DialogActions>
                {cancelAction && <Button onClick={cancelAction}>{t('dialog.button.cancel')}</Button>}
                {!cancelAction && <Button onClick={handleClose}>{t('dialog.button.close')}</Button>}
                {!error && okAction && <Button onClick={okAction}>{okButtonText}</Button>}
            </DialogActions>
        </Dialog>
    );
}
