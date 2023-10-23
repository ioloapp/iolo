import {UiTestament} from "../../services/IcTypesForUi";

export interface TestamentsState {
    testamentsList: UiTestament[],
    dialogItem: UiTestament
    dialogItemState: string,
    loadingState: string,
    error?: string;
    showAddDialog: boolean;
    showEditDialog: boolean;
    showDeleteDialog: boolean;
}

// Define the initial state using that type
export const initialState: TestamentsState = {
    testamentsList: [],
    dialogItem: {
        name: '',
        secrets: [],
        heirs: []
    },
    dialogItemState: 'init',
    loadingState: 'init',
    showAddDialog: false,
    showEditDialog: false,
    showDeleteDialog: false
}
