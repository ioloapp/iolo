import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import AddIcon from "@mui/icons-material/Add";
import {Fab} from "@mui/material";
import {
    selectHeirError,
    selectHeirToAdd,
    selectHeirToAddState,
    selectShowAddHeirDialog
} from "../../redux/heirs/heirsSelectors";
import {addHeirThunk, heirsActions, updateHeirThunk} from "../../redux/heirs/heirsSlice";
import {BasicDialog} from "../dialog/basic-dialog";
import HeirDialogContent from "./heir-dialog-content";

export default function AddHeirDialog() {
    const dispatch = useAppDispatch();
    const showAddHeirDialog = useSelector(selectShowAddHeirDialog);
    const heirToAdd = useSelector(selectHeirToAdd);
    const heirToAddState = useSelector(selectHeirToAddState);
    const heirError = useSelector(selectHeirError);

    const handleClickOpen = () => {
        dispatch(heirsActions.openAddDialog());
    };

    const handleClose = () => {
        dispatch(heirsActions.closeAddDialog());
    };

    const cancelAddHeir = () => {
        dispatch(heirsActions.cancelAddHeir())
    }

    const createHeir = async () => {
        dispatch(addHeirThunk(heirToAdd));
    }

    const updateHeir = async () => {
        dispatch(updateHeirThunk(heirToAdd));
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
            <BasicDialog  title="Add Heir"
            leadText="To add a new Heir enter the id of it and extend it with a known name."
            isOpen={showAddHeirDialog}
            handleClose={handleClose}
            cancelAction={cancelAddHeir}
            okAction={createHeir}
            okButtonText="Add Heir"
            error={heirError}
            loadingState={heirToAddState}>
                <HeirDialogContent />
            </BasicDialog>
        </div>
    );
}
