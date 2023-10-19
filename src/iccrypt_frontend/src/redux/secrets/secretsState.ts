import {UiSecret, UiSecretCategory, UiSecretListEntry} from "../../services/IcTypesForUi";

export interface GroupedSecretList {
    passwordList: UiSecretListEntry[],
    notesList: UiSecretListEntry[],
    documentsList: UiSecretListEntry[],
    othersList: UiSecretListEntry[]
}

export interface SecretsState {
    secretList: UiSecretListEntry[],
    groupedSecretList: GroupedSecretList,
    secretToAdd: UiSecret
    dialogItemState: string,
    listItemsState: string,
    error?: string;
    showAddDialog: boolean;
    showEditDialog: boolean;
    showDeleteDialog: boolean;
}

// Define the initial state using that type
export const initialState: SecretsState = {
    secretList: [],
    groupedSecretList: {
        passwordList: [],
        notesList: [],
        documentsList: [],
        othersList: []
    },
    secretToAdd: {
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
