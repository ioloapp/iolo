import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {testamentsActions, updateTestamentThunk} from "../../redux/testaments/testamentsSlice";
import {
    selectShowEditTestamentDialog,
    selectTestamentError,
    selectTestamentToAdd,
    selectTestamentToAddState
} from "../../redux/testaments/testamentsSelectors";
import {selectCurrentUser} from "../../redux/user/userSelectors";
import SecretDialogContent from "../secret/secret-dialog-content";
import {BasicDialog} from "../dialog/basic-dialog";

export default function EditTestamentDialog() {
    const dispatch = useAppDispatch();
    const showEditTestamentDialog = useSelector(selectShowEditTestamentDialog);
    const testamentToAdd = useSelector(selectTestamentToAdd);
    const testamentError = useSelector(selectTestamentError);
    const testamentToAddState = useSelector(selectTestamentToAddState);
    const currentUser = useSelector(selectCurrentUser);

    const handleClose = () => {
        dispatch(testamentsActions.closeAddDialog());
    };

    const cancelEditTestament = () => {
        dispatch(testamentsActions.cancelEditTestament());
    }

    const updateTestament = async () => {
        dispatch(updateTestamentThunk({
            ...testamentToAdd,
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
                     loadingState={testamentToAddState}>
            <SecretDialogContent/>
        </BasicDialog>
    );
}
