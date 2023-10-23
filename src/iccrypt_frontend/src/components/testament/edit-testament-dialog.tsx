import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {testamentsActions, updateTestamentThunk} from "../../redux/testaments/testamentsSlice";
import {
    selectShowEditTestamentDialog,
    selectTestamentDialogItem,
    selectTestamentDialogItemState,
    selectTestamentError
} from "../../redux/testaments/testamentsSelectors";
import {selectCurrentUser} from "../../redux/user/userSelectors";
import {BasicDialog} from "../dialog/basic-dialog";
import TestamentDialogContent from "./testament-dialog-content";

export default function EditTestamentDialog() {
    const dispatch = useAppDispatch();
    const showEditTestamentDialog = useSelector(selectShowEditTestamentDialog);
    const dialogItem = useSelector(selectTestamentDialogItem);
    const testamentError = useSelector(selectTestamentError);
    const dialogItemState = useSelector(selectTestamentDialogItemState);
    const currentUser = useSelector(selectCurrentUser);

    const handleClose = () => {
        dispatch(testamentsActions.closeAddDialog());
    };

    const cancelEditTestament = () => {
        dispatch(testamentsActions.cancelEditTestament());
    }

    const updateTestament = async () => {
        dispatch(updateTestamentThunk({
            ...dialogItem,
            testator: currentUser,
        }));
    }

    return (
        <BasicDialog title="Edit testament"
                     leadText="Edit your testaments name, secrets and heirs."
                     isOpen={showEditTestamentDialog}
                     handleClose={handleClose}
                     cancelAction={cancelEditTestament}
                     okAction={updateTestament}
                     okButtonText="Update testament"
                     error={testamentError}
                     dialogItemState={dialogItemState}>
            <TestamentDialogContent/>
        </BasicDialog>
    );
}
