import {RootState} from "../store";

export const selectTestaments = (state: RootState)  => state.testaments.testamentsList;

export const selectShowAddTestamentDialog = (state: RootState)  => state.testaments.showAddDialog;

export const selectShowEditTestamentDialog = (state: RootState)  => state.testaments.showEditDialog;

export const selectShowDeleteTestamentDialog = (state: RootState)  => state.testaments.showDeleteDialog;

export const selectTestamentDialogItem = (state: RootState)  => state.testaments.dialogItem;

export const selectTestamentError = (state: RootState)  => state.testaments.error;

export const selectTestamentDialogItemState = (state: RootState)  => state.testaments.dialogItemState;
