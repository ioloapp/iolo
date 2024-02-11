import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {policiesActions, updatePolicyThunk} from "../../redux/policies/policiesSlice";
import {
    selectPolicyDialogItem,
    selectPolicyDialogItemState,
    selectPolicyError,
    selectShowEditPolicyDialog
} from "../../redux/policies/policiesSelectors";
import {selectCurrentUser} from "../../redux/user/userSelectors";
import {BasicDialog} from "../dialog/basic-dialog";
import {PolicyDialogContent} from './policy-dialog-content';
import {UiPolicyWithSecretListEntries} from "../../services/IoloTypesForUi";
import {useTranslation} from "react-i18next";

export default function EditPolicyDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showEditPolicyDialog = useSelector(selectShowEditPolicyDialog);
    const dialogItem: UiPolicyWithSecretListEntries = useSelector(selectPolicyDialogItem);
    const policyError = useSelector(selectPolicyError);
    const dialogItemState = useSelector(selectPolicyDialogItemState);
    const currentUser = useSelector(selectCurrentUser);

    const handleClose = () => {
        dispatch(policiesActions.closeEditDialog());
    };

    const cancelEditPolicy = () => {
        dispatch(policiesActions.cancelEditPolicy());
    }

    const updatePolicy = async () => {
        dispatch(updatePolicyThunk({
            ...dialogItem,
            secrets: dialogItem.secrets.map(s => s.id)
        }));
    }

    return (
        <BasicDialog title={t('policies.dialog.edit.title')}
                     leadText={t('policies.dialog.edit.text')}
                     isOpen={showEditPolicyDialog}
                     handleClose={handleClose}
                     cancelAction={cancelEditPolicy}
                     okAction={updatePolicy}
                     okButtonText={t('policies.dialog.edit.button')}
                     error={policyError}
                     dialogItemState={dialogItemState}>
            <PolicyDialogContent/>
        </BasicDialog>
    );
}
