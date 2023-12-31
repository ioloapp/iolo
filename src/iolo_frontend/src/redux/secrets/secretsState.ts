import {UiSecret, UiSecretCategory, UiSecretListEntry} from "../../services/IoloTypesForUi";

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
    showViewDialog: boolean;
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
    showViewDialog: false,
    showAddDialog: false,
    showEditDialog: false,
    showDeleteDialog: false
}
