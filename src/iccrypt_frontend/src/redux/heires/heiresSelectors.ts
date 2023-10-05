import {RootState} from "../store";

export const selectHeires = (state: RootState)  => state.heires.heiresList;

export const selectShowAddHeiresDialog = (state: RootState)  => state.heires.showAddDialog;

export const selectHeireToAdd = (state: RootState)  => state.heires.heireToAdd;
