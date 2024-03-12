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
import {VaultDialogContent} from './vault-dialog-content';
import {useTranslation} from "react-i18next";

export default function ViewVaultDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showViewSecretDialog: boolean = useSelector(selectShowViewSecretDialog);
    const dialogItemState = useSelector(selectDialogItemState);
    const secretError = useSelector(selectSecretsError);

    const handleClose = () => {
        dispatch(secretsActions.closeViewDialog());
    };

    return (
        <BasicDialog title={t('secrets.dialog.view.title')}
                     leadText={t('secrets.dialog.view.text')}
                     isOpen={showViewSecretDialog}
                     handleClose={handleClose}
                     error={secretError}
                     dialogItemState={dialogItemState}>
            <VaultDialogContent readonly={true}/>
        </BasicDialog>
    );
}
