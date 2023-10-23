import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {
    selectHeirError,
    selectHeirToAdd,
    selectHeirToAddState,
    selectShowEditHeirDialog
} from "../../redux/heirs/heirsSelectors";
import {heirsActions, updateHeirThunk} from "../../redux/heirs/heirsSlice";
import {BasicDialog} from "../dialog/basic-dialog";
import HeirDialogContent from "./heir-dialog-content";

export default function EditHeirDialog() {
    const dispatch = useAppDispatch();
    const showEditHeirDialog = useSelector(selectShowEditHeirDialog);
    const heirToAdd = useSelector(selectHeirToAdd);
    const heirToAddState = useSelector(selectHeirToAddState);
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
            <BasicDialog  title="Edit Heir"
            leadText="Update your hire information"
            isOpen={showEditHeirDialog}
            handleClose={handleClose}
            cancelAction={cancelEditHeir}
            okAction={updateHeir}
            okButtonText="Update Heir"
            error={heirError}
            loadingState={heirToAddState}>
                <HeirDialogContent />
            </BasicDialog>
    );
}
