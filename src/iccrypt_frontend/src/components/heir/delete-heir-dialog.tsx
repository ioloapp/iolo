import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {selectHeirToAdd, selectShowDeleteHeirDialog} from "../../redux/heirs/heirsSelectors";
import {deleteHeirThunk, heirsActions} from "../../redux/heirs/heirsSlice";

export default function DeleteHeirDialog() {
    const dispatch = useAppDispatch();
    const showDeleteHeirDialog: boolean = useSelector(selectShowDeleteHeirDialog);
    const heirToAdd = useSelector(selectHeirToAdd);

    const handleClose = () => {
        dispatch(heirsActions.closeDeleteDialog());
    };

    const cancelAddSecret = () => {
        dispatch(heirsActions.cancelDeleteHeir())
    }

    const deleteSecret = async () => {
        dispatch(deleteHeirThunk(heirToAdd));
    }

    return (
        <Dialog open={showDeleteHeirDialog} onClose={handleClose}>
            <DialogTitle>Delete Heir</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to delete the heir {heirToAdd.name}?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={cancelAddSecret}>Cancel</Button>
                <Button onClick={deleteSecret}>Delete Heir</Button>
            </DialogActions>
        </Dialog>
    );
}
