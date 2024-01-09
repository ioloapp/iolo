import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {
    selectHeirDialogItem,
    selectHeirDialogItemState,
    selectHeirError,
    selectShowEditHeirDialog
} from "../../redux/heirs/heirsSelectors";
import {heirsActions, updateHeirThunk} from "../../redux/heirs/heirsSlice";
import {BasicDialog} from "../dialog/basic-dialog";
import HeirDialogContent from "./heir-dialog-content";
import {useTranslation} from "react-i18next";

export default function EditHeirDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showEditHeirDialog = useSelector(selectShowEditHeirDialog);
    const heirToAdd = useSelector(selectHeirDialogItem);
    const heirToAddState = useSelector(selectHeirDialogItemState);
    const heirError = useSelector(selectHeirError);

    const handleClose = () => {
        dispatch(heirsActions.closeAddDialog());
    };

    const cancelEditHeir = () => {
        dispatch(heirsActions.cancelEditHeir())
    }

    const updateHeir = async () => {
        dispatch(updateHeirThunk(heirToAdd));
    }

    return (
            <BasicDialog  title={t('heirs.dialog.edit.title')}
            leadText={t('heirs.dialog.edit.text')}
            isOpen={showEditHeirDialog}
            handleClose={handleClose}
            cancelAction={cancelEditHeir}
            okAction={updateHeir}
            okButtonText={t('heirs.dialog.edit.button')}
            error={heirError}
            dialogItemState={heirToAddState}>
                <HeirDialogContent />
            </BasicDialog>
    );
}
