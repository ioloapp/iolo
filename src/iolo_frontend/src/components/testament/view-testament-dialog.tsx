import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {testamentsActions} from "../../redux/testaments/testamentsSlice";
import {
    selectShowViewTestamentDialog,
    selectTestamentDialogItem,
    selectTestamentDialogItemState,
    selectTestamentError
} from "../../redux/testaments/testamentsSelectors";
import {BasicDialog} from "../dialog/basic-dialog";
import {TestamentDialogContent} from './testament-dialog-content';
import {SelectListItem} from "../selectlist/select-list";
import {getSecretInViewModeThunk} from "../../redux/secrets/secretsSlice";
import {UiTestamentResponse} from "../../services/IoloTypesForUi";
import {useTranslation} from "react-i18next";

export default function ViewTestamentDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showViewTestamentDialog = useSelector(selectShowViewTestamentDialog);
    const testamentError = useSelector(selectTestamentError);
    const dialogItemState = useSelector(selectTestamentDialogItemState);
    const dialogItem: UiTestamentResponse = useSelector(selectTestamentDialogItem);

    const handleClose = () => {
        dispatch(testamentsActions.closeViewDialog());
    };

    const viewSecret = (value: SelectListItem) => {
        dispatch(getSecretInViewModeThunk({secretId: value.id, testamentId: dialogItem.id}))
    }


    return (
        <BasicDialog title={t('policies.dialog.view.title')}
                     leadText={t('policies.dialog.view.text')}
                     isOpen={showViewTestamentDialog}
                     handleClose={handleClose}
                     error={testamentError}
                     dialogItemState={dialogItemState}>
            <TestamentDialogContent readonly={true} viewSecret={viewSecret}/>
        </BasicDialog>
    );
}
