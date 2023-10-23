import * as React from 'react';
import {useSelector} from "react-redux";
import {
    selectDialogItem,
    selectDialogItemState,
    selectSecretsError,
    selectShowAddSecretDialog
} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {addSecretThunk, secretsActions} from "../../redux/secrets/secretsSlice";
import AddIcon from "@mui/icons-material/Add";
import {Fab} from "@mui/material";
import {BasicDialog} from "../dialog/basic-dialog";
import SecretDialogContent from "./secret-dialog-content";

export default function AddSecretDialog() {
    const dispatch = useAppDispatch();
    const showAddSecretDialog: boolean = useSelector(selectShowAddSecretDialog);
    const secretToAdd = useSelector(selectDialogItem);
    const secretError = useSelector(selectSecretsError);
    const secretToAddState = useSelector(selectDialogItemState);

    const handleClickOpen = () => {
        dispatch(secretsActions.openAddDialog());
    };

    const handleClose = () => {
        dispatch(secretsActions.closeAddOrEditDialog());
    };

    const cancelAddSecret = () => {
        dispatch(secretsActions.cancelAddSecret())
    }

    const createSecret = async () => {
        dispatch(addSecretThunk(secretToAdd));
    }

    return (
        <div>
            <Fab color="primary" aria-label="add" onClick={handleClickOpen} sx={{
                position: "fixed",
                bottom: (theme) => theme.spacing(10),
                right: (theme) => theme.spacing(2)
            }}>
                <AddIcon/>
            </Fab>
            <BasicDialog title="Add secret"
                         leadText="To add a new secret choose the category of it and fill in the necessary information."
                         isOpen={showAddSecretDialog}
                         handleClose={handleClose}
                         cancelAction={cancelAddSecret}
                         okAction={createSecret}
                         okButtonText="Add secret"
                         error={secretError}
                         dialogItemState={secretToAddState}>
                <SecretDialogContent/>
            </BasicDialog>
        </div>
    );
}
