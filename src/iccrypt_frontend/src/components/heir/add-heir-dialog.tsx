import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import AddIcon from "@mui/icons-material/Add";
import {Fab} from "@mui/material";
import {
    selectHeirDialogItem,
    selectHeirDialogItemState,
    selectHeirError,
    selectShowAddHeirDialog
} from "../../redux/heirs/heirsSelectors";
import {addHeirThunk, heirsActions, updateHeirThunk} from "../../redux/heirs/heirsSlice";
import {BasicDialog} from "../dialog/basic-dialog";
import HeirDialogContent from "./heir-dialog-content";

export default function AddHeirDialog() {
    const dispatch = useAppDispatch();
    const showAddHeirDialog = useSelector(selectShowAddHeirDialog);
    const dialogItem = useSelector(selectHeirDialogItem);
    const dialogItemState = useSelector(selectHeirDialogItemState);
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
        dispatch(addHeirThunk(dialogItem));
    }

    const updateHeir = async () => {
        dispatch(updateHeirThunk(dialogItem));
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
            <BasicDialog  title="Add heir"
            leadText="To add a new heir enter the id of it and extend it with a known name."
            isOpen={showAddHeirDialog}
            handleClose={handleClose}
            cancelAction={cancelAddHeir}
            okAction={createHeir}
            okButtonText="Add heir"
            error={heirError}
            dialogItemState={dialogItemState}>
                <HeirDialogContent />
            </BasicDialog>
        </div>
    );
}
