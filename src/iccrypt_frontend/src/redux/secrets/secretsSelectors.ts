import {RootState} from "../store";

export const selectSecrets = (state: RootState)  => state.secrets.secretList;

export const selectShowAddSecretDialog = (state: RootState)  => state.secrets.showAddDialog;

export const selectSecretToAdd = (state: RootState)  => state.secrets.secretToAdd;
