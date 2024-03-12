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
import {VaultDialogContent} from './vault-dialog-content';
import {useTranslation} from "react-i18next";

export default function AddVaultDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
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
            <Fab color="primary" aria-label={t('secrets.dialog.add.button')} onClick={handleClickOpen} sx={{
                position: "fixed",
                bottom: (theme) => theme.spacing(10),
                right: (theme) => theme.spacing(2)
            }}>
                <AddIcon/>
            </Fab>
            <BasicDialog title={t('secrets.dialog.add.title')}
                         leadText={t('secrets.dialog.add.text')}
                         isOpen={showAddSecretDialog}
                         handleClose={handleClose}
                         cancelAction={cancelAddSecret}
                         okAction={createSecret}
                         okButtonText={t('secrets.dialog.add.button')}
                         error={secretError}
                         dialogItemState={secretToAddState}>
                <VaultDialogContent/>
            </BasicDialog>
        </div>
    );
}
