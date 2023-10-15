import {UiTestament} from "../../services/IcTypesForUi";

export interface TestamentsState {
    testamentsList: UiTestament[],
    testamentToAdd: UiTestament
    addState: string,
    loadingState: string,
    error?: string;
    showAddDialog: boolean;
    showEditDialog: boolean;
    showDeleteDialog: boolean;
}

// Define the initial state using that type
export const initialState: TestamentsState = {
    testamentsList: [],
    testamentToAdd: {
        name: '',
        secrets: [],
        heirs: []
    },
    addState: 'init',
    loadingState: 'init',
    showAddDialog: false,
    showEditDialog: false,
    showDeleteDialog: false
}
