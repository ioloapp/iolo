import * as React from 'react';
import {useSelector} from "react-redux";
import {
    selectDialogItem,
    selectDialogItemState,
    selectSecretsError,
    selectShowDeleteSecretDialog
} from "../../redux/secrets/secretsSelectors";
import {useAppDispatch} from "../../redux/hooks";
import {deleteSecretThunk, secretsActions} from "../../redux/secrets/secretsSlice";
import {BasicDialog} from "../dialog/basic-dialog";
import {Trans, useTranslation} from "react-i18next";

export default function DeleteVaultDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showDeleteSecretDialog: boolean = useSelector(selectShowDeleteSecretDialog);
    const dialogItem = useSelector(selectDialogItem);
    const dialogItemState = useSelector(selectDialogItemState);
    const secretError = useSelector(selectSecretsError);

    const handleClose = () => {
        dispatch(secretsActions.closeAddOrEditDialog());
    };

    const cancelDeleteSecret = () => {
        dispatch(secretsActions.cancelDeleteSecret())
    }

    const deleteSecret = async () => {
        dispatch(deleteSecretThunk(dialogItem));
    }

    return (
        <BasicDialog title={t('secrets.dialog.delete.title')}
                     leadText={<Trans i18nKey='secrets.dialog.delete.text' values={{secret: dialogItem?.name}} />}
                     isOpen={showDeleteSecretDialog}
                     handleClose={handleClose}
                     cancelAction={cancelDeleteSecret}
                     okAction={deleteSecret}
                     okButtonText={t('secrets.dialog.delete.button')}
                     error={secretError}
                     dialogItemState={dialogItemState}>
        </BasicDialog>
    );
}
