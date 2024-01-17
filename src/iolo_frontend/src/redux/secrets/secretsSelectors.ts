import {RootState} from "../store";

export const selectGroupedSecrets = (state: RootState)  => state.secrets.groupedSecretList;

export const selectSecretListState = (state: RootState)  => state.secrets.listItemsState;

export const selectShowAddSecretDialog = (state: RootState)  => state.secrets.showAddDialog;

export const selectShowEditSecretDialog = (state: RootState)  => state.secrets.showEditDialog;

export const selectShowViewSecretDialog = (state: RootState)  => state.secrets.showViewDialog;

export const selectDialogItemState = (state: RootState)  => state.secrets.dialogItemState;

export const selectShowDeleteSecretDialog = (state: RootState)  => state.secrets.showDeleteDialog;

export const selectDialogItem = (state: RootState)  => state.secrets.dialogItem;

export const selectSecretsError = (state: RootState)  => state.secrets.error;
