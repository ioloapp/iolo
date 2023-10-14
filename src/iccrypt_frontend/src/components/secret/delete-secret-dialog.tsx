import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {useSelector} from "react-redux";
import {selectSecretToAdd, selectShowDeleteSecretDialog} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {deleteSecretThunk, secretsActions} from "../../redux/secrets/secretsSlice";

export default function DeleteSecretDialog() {
    const dispatch = useAppDispatch();
    const showDeleteSecretDialog: boolean = useSelector(selectShowDeleteSecretDialog);
    const secretToAdd = useSelector(selectSecretToAdd);

    const handleClose = () => {
        dispatch(secretsActions.closeAddOrEditDialog());
    };

    const cancelAddSecret = () => {
        dispatch(secretsActions.cancelDeleteSecret())
    }

    const deleteSecret = async () => {
        dispatch(deleteSecretThunk(secretToAdd));
    }

    return (
        <Dialog open={showDeleteSecretDialog} onClose={handleClose}>
            <DialogTitle>Delete Secret</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to delete the secret {secretToAdd.name}?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={cancelAddSecret}>Cancel</Button>
                <Button onClick={deleteSecret}>Delete Secret</Button>
            </DialogActions>
        </Dialog>
    );
}
