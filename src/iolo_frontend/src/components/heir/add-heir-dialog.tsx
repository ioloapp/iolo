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
import {useTranslation} from "react-i18next";

export default function AddHeirDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
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
            <Fab color="primary" aria-label={t('heirs.dialog.add.button')} onClick={handleClickOpen} sx={{
                position: "fixed",
                bottom: (theme) => theme.spacing(10),
                right: (theme) => theme.spacing(2)
            }}>
                <AddIcon/>
            </Fab>
            <BasicDialog  title={t('heirs.dialog.add.title')}
            leadText={t('heirs.dialog.add.text')}
            isOpen={showAddHeirDialog}
            handleClose={handleClose}
            cancelAction={cancelAddHeir}
            okAction={createHeir}
            okButtonText={t('heirs.dialog.add.button')}
            error={heirError}
            dialogItemState={dialogItemState}>
                <HeirDialogContent />
            </BasicDialog>
        </div>
    );
}
