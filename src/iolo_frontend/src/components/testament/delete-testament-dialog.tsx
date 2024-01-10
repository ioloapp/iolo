import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {
    selectShowDeleteTestamentDialog,
    selectTestamentDialogItem,
    selectTestamentDialogItemState,
    selectTestamentError
} from "../../redux/testaments/testamentsSelectors";
import {deleteTestamentThunk, testamentsActions} from "../../redux/testaments/testamentsSlice";
import {BasicDialog} from "../dialog/basic-dialog";
import {UiTestamentResponse} from "../../services/IoloTypesForUi";
import {Trans, useTranslation} from "react-i18next";

export default function DeleteTestamentDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showDeleteTestamentDialog: boolean = useSelector(selectShowDeleteTestamentDialog);
    const dialogItem: UiTestamentResponse = useSelector(selectTestamentDialogItem);
    const testamentError = useSelector(selectTestamentError);
    const dialogItemState = useSelector(selectTestamentDialogItemState);

    const handleClose = () => {
        dispatch(testamentsActions.closeDeleteDialog());
    };

    const cancelDeleteTestament = () => {
        dispatch(testamentsActions.cancelDeleteTestament())
    }

    const deleteTestament = async () => {
        dispatch(deleteTestamentThunk(dialogItem.id));
    }

    return (
        <BasicDialog  title={t('policies.dialog.delete.title')}
                      leadText={<Trans i18nKey="policies.dialog.delete.text" values={{policy: dialogItem.name}} />}
                      isOpen={showDeleteTestamentDialog}
                      handleClose={handleClose}
                      cancelAction={cancelDeleteTestament}
                      okAction={deleteTestament}
                      okButtonText={t('policies.dialog.delete.button')}
                      error={testamentError}
                      dialogItemState={dialogItemState}>
        </BasicDialog>
    );
}
