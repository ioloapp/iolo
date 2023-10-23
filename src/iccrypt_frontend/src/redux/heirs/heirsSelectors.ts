import {RootState} from "../store";

export const selectHeirs = (state: RootState)  => state.heirs.heirsList;

export const selectShowAddHeirDialog = (state: RootState)  => state.heirs.showAddDialog;

export const selectShowEditHeirDialog = (state: RootState)  => state.heirs.showEditDialog;

export const selectShowDeleteHeirDialog = (state: RootState)  => state.heirs.showDeleteDialog;

export const selectHeirDialogItem = (state: RootState)  => state.heirs.dialogItem;

export const selectHeirError = (state: RootState)  => state.heirs.error;

export const selectHeirDialogItemState = (state: RootState)  => state.heirs.dialogItemState;
