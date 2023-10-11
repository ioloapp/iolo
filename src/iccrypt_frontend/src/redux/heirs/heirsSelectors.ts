import {RootState} from "../store";

export const selectHeirs = (state: RootState)  => state.heirs.heirsList;

export const selectShowAddHeirDialog = (state: RootState)  => state.heirs.showAddDialog;

export const selectHeirToAdd = (state: RootState)  => state.heirs.heirToAdd;
