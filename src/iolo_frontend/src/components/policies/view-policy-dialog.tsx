import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {policiesActions} from "../../redux/policies/policiesSlice";
import {
    selectPolicyDialogItem,
    selectPolicyDialogItemState,
    selectPolicyError,
    selectShowViewPolicyDialog
} from "../../redux/policies/policiesSelectors";
import {BasicDialog} from "../dialog/basic-dialog";
import {PolicyDialogContent} from './policy-dialog-content';
import {SelectListItem} from "../selectlist/select-list";
import {getSecretInViewModeThunk} from "../../redux/secrets/secretsSlice";
import {UiPolicyWithSecretListEntries} from "../../services/IoloTypesForUi";
import {useTranslation} from "react-i18next";

export default function ViewPolicyDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showViewPolicyDialog = useSelector(selectShowViewPolicyDialog);
    const policyError = useSelector(selectPolicyError);
    const dialogItemState = useSelector(selectPolicyDialogItemState);
    const dialogItem: UiPolicyWithSecretListEntries = useSelector(selectPolicyDialogItem);

    const handleClose = () => {
        dispatch(policiesActions.closeViewDialog());
    };

    const viewSecret = (value: SelectListItem) => {
        dispatch(getSecretInViewModeThunk({secretId: value.id, policyId: dialogItem.id}))
    }


    return (
        <BasicDialog title={t('policies.dialog.view.title')}
                     leadText={t('policies.dialog.view.text')}
                     isOpen={showViewPolicyDialog}
                     handleClose={handleClose}
                     error={policyError}
                     dialogItemState={dialogItemState}>
            <PolicyDialogContent readonly={true} viewSecret={viewSecret}/>
        </BasicDialog>
    );
}
