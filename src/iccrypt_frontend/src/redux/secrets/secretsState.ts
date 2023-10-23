import {UiSecret, UiSecretCategory, UiSecretListEntry} from "../../services/IcTypesForUi";

export interface GroupedSecretList {
    passwordList: UiSecretListEntry[],
    notesList: UiSecretListEntry[],
    documentsList: UiSecretListEntry[],
    othersList: UiSecretListEntry[]
}

export interface SecretsState {
    groupedSecretList: GroupedSecretList,
    dialogItem: UiSecret
    dialogItemState: string,
    listItemsState: string,
    error?: string;
    showAddDialog: boolean;
    showEditDialog: boolean;
    showDeleteDialog: boolean;
}

// Define the initial state using that type
export const initialState: SecretsState = {
    groupedSecretList: {
        passwordList: [],
        notesList: [],
        documentsList: [],
        othersList: []
    },
    dialogItem: {
        category: UiSecretCategory.Password,
        name: '',
        username: '',
        password: '',
        url: ''
    },
    dialogItemState: 'init',
    listItemsState: 'init',
    showAddDialog: false,
    showEditDialog: false,
    showDeleteDialog: false
}
