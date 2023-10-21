import {UiUser, UiUserType} from "../../services/IcTypesForUi";

export interface HeirsState {
    heirsList: UiUser[],
    heirToAdd: UiUser
    addState: string,
    loadingState: string,
    error?: string;
    showAddDialog: boolean;
    showEditDialog: boolean;
    showDeleteDialog: boolean;
}

// Define the initial state using that type
export const initialState: HeirsState = {
    heirsList: [],
    heirToAdd: {
        type: UiUserType.Person,
        id: '',
        name: '',
        email: ''
    },
    addState: 'init',
    loadingState: 'init',
    showAddDialog: false,
    showEditDialog: false,
    showDeleteDialog: false
}
