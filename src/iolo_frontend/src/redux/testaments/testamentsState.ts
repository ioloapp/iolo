import {UiTestamentListEntry, UiTestamentResponse} from "../../services/IoloTypesForUi";

export interface TestamentsState {
    testamentsList: UiTestamentListEntry[],
    dialogItem: UiTestamentResponse
    dialogItemState: string,
    loadingState: string,
    error?: string;
    showAddDialog: boolean;
    showViewDialog: boolean;
    showEditDialog: boolean;
    showDeleteDialog: boolean;
}

// Define the initial state using that type
export const initialState: TestamentsState = {
    testamentsList: [],
    dialogItem: {
        name: '',
        secrets: [],
        heirs: [],
        conditionsStatus: false,
        conditionsLogicalOperator: null,
        conditions: []
    },
    dialogItemState: 'init',
    loadingState: 'init',
    showAddDialog: false,
    showViewDialog: false,
    showEditDialog: false,
    showDeleteDialog: false
}
