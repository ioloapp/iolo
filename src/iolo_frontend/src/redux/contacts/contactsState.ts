import {UiUser, UiUserType} from "../../services/IoloTypesForUi";

export interface ContactsState {
    contactsList: UiUser[],
    dialogItem: UiUser
    dialogItemState: string,
    loadingState: string,
    error?: string;
    showAddDialog: boolean;
    showEditDialog: boolean;
    showDeleteDialog: boolean;
}

// Define the initial state using that type
export const initialState: ContactsState = {
    contactsList: [],
    dialogItem: {
        type: UiUserType.Person,
        id: '',
        name: '',
        email: ''
    },
    dialogItemState: 'init',
    loadingState: 'init',
    showAddDialog: false,
    showEditDialog: false,
    showDeleteDialog: false
}
