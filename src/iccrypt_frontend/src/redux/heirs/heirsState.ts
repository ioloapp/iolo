import {UiUser, UserType} from "../../services/IcTypesForUi";

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
        type: UserType.Person,
        id: '',
        name: '',
        firstname: '',
        email: ''
    },
    addState: 'init',
    loadingState: 'init',
    showAddDialog: false,
    showEditDialog: false,
    showDeleteDialog: false
}
