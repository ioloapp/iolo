import {RootState} from "../store";

export const selectSecrets = (state: RootState)  => state.secrets.secretList;

export const selectGroupedSecrets = (state: RootState)  => state.secrets.groupedSecretList;

export const selectShowAddSecretDialog = (state: RootState)  => state.secrets.showAddDialog;

export const selectShowEditSecretDialog = (state: RootState)  => state.secrets.showEditDialog;

export const selectDialogItemState = (state: RootState)  => state.secrets.dialogItemState;

export const selectShowDeleteSecretDialog = (state: RootState)  => state.secrets.showDeleteDialog;

export const selectSecretToAdd = (state: RootState)  => state.secrets.secretToAdd;

export const selectSecretsError = (state: RootState)  => state.secrets.error;

export const selectSecretsToAddState = (state: RootState)  => state.secrets.addState;
