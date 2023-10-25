import {UiTestament, UiTestamentListEntry} from "../../services/IcTypesForUi";

export interface TestamentsState {
    testamentsList: UiTestamentListEntry[],
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
        heirs: [],
        conditionArg: BigInt(0),
    },
    dialogItemState: 'init',
    loadingState: 'init',
    showAddDialog: false,
    showEditDialog: false,
    showDeleteDialog: false
}
