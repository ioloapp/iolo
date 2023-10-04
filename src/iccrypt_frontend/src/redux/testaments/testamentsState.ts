import {UiTestament} from "../../services/IcTypesForUi";

export interface TestamentsState {
    testamentsList: UiTestament[],
    testamentToAdd: UiTestament
    addState: string,
    loadingState: string,
    error?: string;
    showAddDialog: boolean
}

// Define the initial state using that type
export const initialState: TestamentsState = {
    testamentsList: [],
    testamentToAdd: {},
    addState: 'init',
    loadingState: 'init',
    showAddDialog: false
}
