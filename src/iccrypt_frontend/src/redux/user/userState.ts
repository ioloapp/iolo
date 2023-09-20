export interface UserState {
    principal: String,
    userVaultExisting: boolean,
    loginStatus?: string,
    error?: string;
}

// Define the initial state using that type
export const initialState: UserState = {
    principal: undefined,
    userVaultExisting: false
}
