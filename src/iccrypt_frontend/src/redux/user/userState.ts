export interface UserState {
    principal: String,
    userVaultExisting: boolean,
}

// Define the initial state using that type
export const initialState: UserState = {
    principal: undefined,
    userVaultExisting: false,
}
