import {RootState} from "../store";

export const selectTestaments = (state: RootState)  => state.testaments.testamentsList;

export const selectShowAddTestamentDialog = (state: RootState)  => state.testaments.showAddDialog;

export const selectTestamentToAdd = (state: RootState)  => state.testaments.testamentToAdd;
