import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {
    selectHeirDialogItem,
    selectHeirDialogItemState,
    selectHeirError,
    selectShowDeleteHeirDialog
} from "../../redux/heirs/heirsSelectors";
import {deleteHeirThunk, heirsActions} from "../../redux/heirs/heirsSlice";
import {BasicDialog} from "../dialog/basic-dialog";
import {Trans, useTranslation} from "react-i18next";

export default function DeleteHeirDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showDeleteHeirDialog: boolean = useSelector(selectShowDeleteHeirDialog);
    const heirToAdd = useSelector(selectHeirDialogItem);
    const heirError = useSelector(selectHeirError);
    const heirToAddState = useSelector(selectHeirDialogItemState);

    const handleClose = () => {
        dispatch(heirsActions.closeDeleteDialog());
    };

    const cancelDeleteHeir = () => {
        dispatch(heirsActions.cancelDeleteHeir())
    }

    const deleteHeir = async () => {
        dispatch(deleteHeirThunk(heirToAdd));
    }

    return (
        <BasicDialog  title={t('contacts.dialog.delete.title')}
                      leadText={<Trans i18nKey='contacts.dialog.delete.text' values={{contact: heirToAdd.name}} />}
                      isOpen={showDeleteHeirDialog}
                      handleClose={handleClose}
                      cancelAction={cancelDeleteHeir}
                      okAction={deleteHeir}
                      okButtonText={t('contacts.dialog.delete.button')}
                      error={heirError}
                      dialogItemState={heirToAddState}>
        </BasicDialog>
    );
}
