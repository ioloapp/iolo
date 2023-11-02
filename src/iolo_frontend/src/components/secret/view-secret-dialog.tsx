import * as React from 'react';
import {useSelector} from "react-redux";
import {
    selectDialogItemState,
    selectSecretsError,
    selectShowViewSecretDialog
} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {secretsActions} from "../../redux/secrets/secretsSlice";
import {BasicDialog} from "../dialog/basic-dialog";
import {SecretDialogContent} from './secret-dialog-content';

export default function ViewSecretDialog() {
    const dispatch = useAppDispatch();
    const showViewSecretDialog: boolean = useSelector(selectShowViewSecretDialog);
    const dialogItemState = useSelector(selectDialogItemState);
    const secretError = useSelector(selectSecretsError);

    const handleClose = () => {
        dispatch(secretsActions.closeViewDialog());
    };

    return (
        <BasicDialog title="Edit secret"
                     leadText="Edit your secret"
                     isOpen={showViewSecretDialog}
                     handleClose={handleClose}
                     error={secretError}
                     dialogItemState={dialogItemState}>
            <SecretDialogContent readonly={true}/>
        </BasicDialog>
    );
}
