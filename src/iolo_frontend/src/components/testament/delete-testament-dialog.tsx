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

export default function DeleteTestamentDialog() {
    const dispatch = useAppDispatch();
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
        <BasicDialog  title="Delete testament"
                      leadText={`Are you sure you want to delete the testament ${dialogItem.name}?`}
                      isOpen={showDeleteTestamentDialog}
                      handleClose={handleClose}
                      cancelAction={cancelDeleteTestament}
                      okAction={deleteTestament}
                      okButtonText="Delete testament"
                      error={testamentError}
                      dialogItemState={dialogItemState}>
        </BasicDialog>
    );
}
