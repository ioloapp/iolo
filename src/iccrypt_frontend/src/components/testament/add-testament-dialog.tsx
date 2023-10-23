import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import AddIcon from "@mui/icons-material/Add";
import {Fab} from "@mui/material";
import {addTestamentThunk, testamentsActions} from "../../redux/testaments/testamentsSlice";
import {
    selectShowAddTestamentDialog,
    selectTestamentError,
    selectTestamentToAdd,
    selectTestamentToAddState
} from "../../redux/testaments/testamentsSelectors";
import {selectCurrentUser} from "../../redux/user/userSelectors";
import SecretDialogContent from "../secret/secret-dialog-content";
import {BasicDialog} from "../dialog/basic-dialog";

export default function AddTestamentDialog() {
    const dispatch = useAppDispatch();
    const showAddTestamentDialog = useSelector(selectShowAddTestamentDialog);
    const testamentToAdd = useSelector(selectTestamentToAdd);
    const testamentError = useSelector(selectTestamentError);
    const testamentToAddState = useSelector(selectTestamentToAddState);
    const currentUser = useSelector(selectCurrentUser);

    const handleClickOpen = () => {
        dispatch(testamentsActions.openAddDialog());
    };

    const handleClose = () => {
        dispatch(testamentsActions.closeAddDialog());
    };

    const cancelAddTestament = () => {
        dispatch(testamentsActions.cancelAddTestament());
    }

    const createTestament = async () => {
        dispatch(addTestamentThunk({
            ...testamentToAdd,
            testator: currentUser
        }));
    }

    return (
        <div>
            <Fab color="primary" aria-label="add" onClick={handleClickOpen} sx={{
                position: "fixed",
                bottom: (theme) => theme.spacing(10),
                right: (theme) => theme.spacing(2)
            }}>
                <AddIcon/>
            </Fab>
            <BasicDialog title="Add testament"
                         leadText="To add a testament choose the secrets, heirs and fill in the necessary information."
                         isOpen={showAddTestamentDialog}
                         handleClose={handleClose}
                         cancelAction={cancelAddTestament}
                         okAction={createTestament}
                         okButtonText="Add testament"
                         error={testamentError}
                         loadingState={testamentToAddState}>
                <SecretDialogContent/>
            </BasicDialog>
        </div>
    );
}
