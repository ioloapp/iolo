import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import AddIcon from "@mui/icons-material/Add";
import {Fab} from "@mui/material";
import {addPolicyThunk, policiesActions} from "../../redux/policies/policiesSlice";
import {
    selectPolicyDialogItem,
    selectPolicyDialogItemState,
    selectPolicyError,
    selectShowAddPolicyDialog
} from "../../redux/policies/policiesSelectors";
import {selectCurrentUser} from "../../redux/user/userSelectors";
import {BasicDialog} from "../dialog/basic-dialog";
import {PolicyDialogContent} from './policy-dialog-content';
import {UiPolicy, UiPolicyWithSecretListEntries} from "../../services/IoloTypesForUi";
import {useTranslation} from "react-i18next";

export default function AddPolicyDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showAddPolicyDialog = useSelector(selectShowAddPolicyDialog);
    const dialogItem: UiPolicyWithSecretListEntries = useSelector(selectPolicyDialogItem);
    const policyError = useSelector(selectPolicyError);
    const dialogItemState = useSelector(selectPolicyDialogItemState);
    const currentUser = useSelector(selectCurrentUser);

    const handleClickOpen = () => {
        dispatch(policiesActions.openAddDialog());
    };

    const handleClose = () => {
        dispatch(policiesActions.closeAddDialog());
    };

    const cancelAddPolicy = () => {
        dispatch(policiesActions.cancelAddPolicy());
    }

    const createPolicy = async () => {
        dispatch(addPolicyThunk({
            ...dialogItem,
            owner: currentUser,
            secrets: dialogItem.secrets.map(s => s.id)
        } as UiPolicy));
    }

    return (
        <div>
            <Fab color="primary" aria-label={t('policies.dialog.add.button')} onClick={handleClickOpen} sx={{
                position: "fixed",
                bottom: (theme) => theme.spacing(10),
                right: (theme) => theme.spacing(2)
            }}>
                <AddIcon/>
            </Fab>
            <BasicDialog title={t('policies.dialog.add.title')}
                         leadText={t('policies.dialog.add.text')}
                         isOpen={showAddPolicyDialog}
                         handleClose={handleClose}
                         cancelAction={cancelAddPolicy}
                         okAction={createPolicy}
                         okButtonText={t('policies.dialog.add.button')}
                         error={policyError}
                         dialogItemState={dialogItemState}>
                <PolicyDialogContent/>
            </BasicDialog>
        </div>
    );
}
