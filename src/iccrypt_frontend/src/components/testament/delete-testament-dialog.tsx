import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {selectShowDeleteTestamentDialog, selectTestamentToAdd} from "../../redux/testaments/testamentsSelectors";
import {deleteTestamentThunk, testamentsActions} from "../../redux/testaments/testamentsSlice";

export default function DeleteTestamentDialog() {
    const dispatch = useAppDispatch();
    const showDeleteTestamentDialog: boolean = useSelector(selectShowDeleteTestamentDialog);
    const testamentToAdd = useSelector(selectTestamentToAdd);

    const handleClose = () => {
        dispatch(testamentsActions.closeDeleteDialog());
    };

    const cancelAddSecret = () => {
        dispatch(testamentsActions.cancelDeleteTestament())
    }

    const deleteSecret = async () => {
        dispatch(deleteTestamentThunk(testamentToAdd));
    }

    return (
        <Dialog open={showDeleteTestamentDialog} onClose={handleClose}>
            <DialogTitle>Delete Secret</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to delete the testament {testamentToAdd.name}?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={cancelAddSecret}>Cancel</Button>
                <Button onClick={deleteSecret}>Delete Testament</Button>
            </DialogActions>
        </Dialog>
    );
}
