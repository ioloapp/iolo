import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {
    selectShowDeleteTestamentDialog,
    selectTestamentError,
    selectTestamentToAdd,
    selectTestamentToAddState
} from "../../redux/testaments/testamentsSelectors";
import {deleteTestamentThunk, testamentsActions} from "../../redux/testaments/testamentsSlice";
import {BasicDialog} from "../dialog/basic-dialog";

export default function DeleteTestamentDialog() {
    const dispatch = useAppDispatch();
    const showDeleteTestamentDialog: boolean = useSelector(selectShowDeleteTestamentDialog);
    const testamentToAdd = useSelector(selectTestamentToAdd);
    const testamentError = useSelector(selectTestamentError);
    const testamentToAddState = useSelector(selectTestamentToAddState);

    const handleClose = () => {
        dispatch(testamentsActions.closeDeleteDialog());
    };

    const cancelDeleteTestament = () => {
        dispatch(testamentsActions.cancelDeleteTestament())
    }

    const deleteTestament = async () => {
        dispatch(deleteTestamentThunk(testamentToAdd));
    }

    return (
        <BasicDialog  title="Delete testament"
                      leadText={`Are you sure you want to delete the testament ${testamentToAdd.name}?`}
                      isOpen={showDeleteTestamentDialog}
                      handleClose={handleClose}
                      cancelAction={cancelDeleteTestament}
                      okAction={deleteTestament}
                      okButtonText="Delete testament"
                      error={testamentError}
                      loadingState={testamentToAddState}>
        </BasicDialog>
    );
}
