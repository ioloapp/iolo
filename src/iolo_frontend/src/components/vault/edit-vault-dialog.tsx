import * as React from 'react';
import {useSelector} from "react-redux";
import {
    selectDialogItem,
    selectDialogItemState,
    selectSecretsError,
    selectShowEditSecretDialog
} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {secretsActions, updateSecretThunk} from "../../redux/secrets/secretsSlice";
import {BasicDialog} from "../dialog/basic-dialog";
import {VaultDialogContent} from './vault-dialog-content';
import {useTranslation} from "react-i18next";

export default function EditVaultDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showEditSecretDialog: boolean = useSelector(selectShowEditSecretDialog);
    const dialogItem = useSelector(selectDialogItem);
    const dialogItemState = useSelector(selectDialogItemState);
    const secretError = useSelector(selectSecretsError);

    const handleClose = () => {
        dispatch(secretsActions.closeAddOrEditDialog());
    };

    const cancelEditSecret = () => {
        dispatch(secretsActions.cancelEditSecret())
    }

    const updateSecret = async () => {
        dispatch(updateSecretThunk(dialogItem));
    }

    return (
        <BasicDialog title={t('secrets.dialog.edit.title')}
                     leadText={t('secrets.dialog.edit.text')}
                     isOpen={showEditSecretDialog}
                     handleClose={handleClose}
                     cancelAction={cancelEditSecret}
                     okAction={updateSecret}
                     okButtonText={t('secrets.dialog.edit.button')}
                     error={secretError}
                     dialogItemState={dialogItemState}>
            <VaultDialogContent/>
        </BasicDialog>
    );
}
