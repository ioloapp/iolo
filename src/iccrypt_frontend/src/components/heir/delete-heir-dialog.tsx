import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {
    selectHeirError,
    selectHeirToAdd,
    selectHeirToAddState,
    selectShowDeleteHeirDialog
} from "../../redux/heirs/heirsSelectors";
import {deleteHeirThunk, heirsActions} from "../../redux/heirs/heirsSlice";
import {BasicDialog} from "../dialog/basic-dialog";

export default function DeleteHeirDialog() {
    const dispatch = useAppDispatch();
    const showDeleteHeirDialog: boolean = useSelector(selectShowDeleteHeirDialog);
    const heirToAdd = useSelector(selectHeirToAdd);
    const heirError = useSelector(selectHeirError);
    const heirToAddState = useSelector(selectHeirToAddState);

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
        <BasicDialog  title="Delete Heir"
                      leadText={`Are you sure you want to delete the heir ${heirToAdd.name}?`}
                      isOpen={showDeleteHeirDialog}
                      handleClose={handleClose}
                      cancelAction={cancelDeleteHeir}
                      okAction={deleteHeir}
                      okButtonText="Delete Heir"
                      error={heirError}
                      loadingState={heirToAddState}>
        </BasicDialog>
    );
}
