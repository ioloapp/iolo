import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {
    selectPolicyDialogItem,
    selectPolicyDialogItemState,
    selectPolicyError,
    selectShowDeletePolicyDialog
} from "../../redux/policies/policiesSelectors";
import {deletePolicyThunk, policiesActions} from "../../redux/policies/policiesSlice";
import {BasicDialog} from "../dialog/basic-dialog";
import {UiPolicyWithSecretListEntries} from "../../services/IoloTypesForUi";
import {Trans, useTranslation} from "react-i18next";

export default function DeletePolicyDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showDeletePolicyDialog: boolean = useSelector(selectShowDeletePolicyDialog);
    const dialogItem: UiPolicyWithSecretListEntries = useSelector(selectPolicyDialogItem);
    const policyError = useSelector(selectPolicyError);
    const dialogItemState = useSelector(selectPolicyDialogItemState);

    const handleClose = () => {
        dispatch(policiesActions.closeDeleteDialog());
    };

    const cancelDeletePolicy = () => {
        dispatch(policiesActions.cancelDeletePolicy())
    }

    const deletePolicy = async () => {
        dispatch(deletePolicyThunk(dialogItem.id));
    }

    return (
        <BasicDialog  title={t('policies.dialog.delete.title')}
                      leadText={<Trans i18nKey="policies.dialog.delete.text" values={{policy: dialogItem.name}} />}
                      isOpen={showDeletePolicyDialog}
                      handleClose={handleClose}
                      cancelAction={cancelDeletePolicy}
                      okAction={deletePolicy}
                      okButtonText={t('policies.dialog.delete.button')}
                      error={policyError}
                      dialogItemState={dialogItemState}>
        </BasicDialog>
    );
}
