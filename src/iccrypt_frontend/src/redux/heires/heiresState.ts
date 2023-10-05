import {UiTestament} from "../../services/IcTypesForUi";

export interface HeiresState {
    heiresList: UiTestament[],
    heireToAdd: UiTestament
    addState: string,
    loadingState: string,
    error?: string;
    showAddDialog: boolean
}

// Define the initial state using that type
export const initialState: HeiresState = {
    heiresList: [],
    heireToAdd: {},
    addState: 'init',
    loadingState: 'init',
    showAddDialog: false
}
