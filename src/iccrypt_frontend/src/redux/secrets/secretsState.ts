import {Secret, SecretListEntry} from "../../../../declarations/iccrypt_backend/iccrypt_backend.did";

export interface GroupedSecretList {
    passwordList: SecretListEntry[],
    notesList: SecretListEntry[],
    documentsList: SecretListEntry[],
    othersList: SecretListEntry[]
}

export interface SecretsState {
    secretList: GroupedSecretList,
    secretToAdd: Secret
    addState: string,
    loadingState: string,
    error?: string;
}

// Define the initial state using that type
export const initialState: SecretsState = {
    secretList: {
        passwordList: [],
        notesList: [],
        documentsList: [],
        othersList: []
    },
    secretToAdd: undefined,
    addState: 'init',
    loadingState: 'init'
}
