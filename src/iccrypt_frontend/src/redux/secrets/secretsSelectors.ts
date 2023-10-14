import {RootState} from "../store";

export const selectSecrets = (state: RootState)  => state.secrets.secretList;

export const selectGroupedSecrets = (state: RootState)  => state.secrets.groupedSecretList;

export const selectShowAddSecretDialog = (state: RootState)  => state.secrets.showAddDialog;

export const selectShowEditSecretDialog = (state: RootState)  => state.secrets.showEditDialog;

export const selectShowDeleteSecretDialog = (state: RootState)  => state.secrets.showDeleteDialog;

export const selectSecretToAdd = (state: RootState)  => state.secrets.secretToAdd;
