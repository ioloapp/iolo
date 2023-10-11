import {UiUser} from "../../services/IcTypesForUi";

export interface HeirsState {
    heirsList: UiUser[],
    heirToAdd: UiUser
    addState: string,
    loadingState: string,
    error?: string;
    showAddDialog: boolean
}

// Define the initial state using that type
export const initialState: HeirsState = {
    heirsList: [],
    heirToAdd: {},
    addState: 'init',
    loadingState: 'init',
    showAddDialog: false
}
