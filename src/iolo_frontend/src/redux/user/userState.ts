import {UiUser, UiUserType} from "../../services/IoloTypesForUi";

export interface UserState {
    principal: string,
    user?: UiUser;
    loginStatus: string,
    error?: string;
    mode: 'dark' | 'light';
}

// Define the initial state using that type
export const initialState: UserState = {
    principal: undefined,
    loginStatus: 'init',
    user: {
        type: UiUserType.Person
    },
    mode: 'light'
}
