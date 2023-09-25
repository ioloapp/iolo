import {Secret, SecretListEntry} from "../../../../declarations/iccrypt_backend/iccrypt_backend.did";

export interface SecretsState {
    secretList: SecretListEntry[],
    secretToAdd: Secret
    loginStatus: string;
    error?: string;
}

// Define the initial state using that type
export const initialState: SecretsState = {
    secretList: [],
    secretToAdd: undefined,
    loginStatus: 'init'
}
