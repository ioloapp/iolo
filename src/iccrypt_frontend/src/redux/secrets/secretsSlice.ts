import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {GroupedSecretList, initialState} from "./secretsState";
import {SecretListEntry} from "../../../../declarations/iccrypt_backend/iccrypt_backend.did";
import IcCryptService from "../../services/IcCryptService";
import {RootState} from "../store";
import {UiSecret, UiSecretCategory, UiSecretListEntry} from "../../services/IcTypesForUi";

const icCryptService = new IcCryptService();

export const addSecretThunk = createAsyncThunk<SecretListEntry, UiSecret, { state: RootState }>('secrets/add',
    async (secret, {rejectWithValue}) => {
        console.log('add secret', secret)
        try {
            const result = await icCryptService.addSecret(secret);
            console.log('result', result)
            return result;
        }catch (e){
            rejectWithValue(e)
        }
    }
);

export const loadSecretsThunk = createAsyncThunk<SecretListEntry[], void, { state: RootState }>('secrets/load',
    async () => {
        const result = await icCryptService.getSecretList();
        console.log('loaded secrets', result)
        return result;
    }
);

// Define a type for the slice state
export const secretsSlice = createSlice({
    name: 'secrets',
    initialState,
    reducers: {
        closeAddDialog: state => {
            state.showAddDialog = false
        },
        openAddDialog: state => {
            state.showAddDialog = true
        },
        cancelAddSecret: state => {
            state.secretToAdd = {};
            state.showAddDialog = false;
        },
        updateSecretToAdd: (state, action) => {
            state.secretToAdd = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadSecretsThunk.pending, (state) => {
                state.loadingState = 'loading';
            })
            .addCase(loadSecretsThunk.fulfilled, (state, action) => {
                state.loadingState = 'succeeded';
                state.secretList = splitSecretListByCategory(action.payload)
            })
            .addCase(loadSecretsThunk.rejected, (state, action) => {
                state.loadingState = 'failed';
                state.error = action.error.message;
            })
            .addCase(addSecretThunk.pending, (state) => {
                state.addState = 'loading';
            })
            .addCase(addSecretThunk.fulfilled, (state, action) => {
                state.addState = 'succeeded';
                state.secretList = addSecretToGroupedSecretList(state.secretList, action.payload)
            })
            .addCase(addSecretThunk.rejected, (state, action) => {
                state.addState = 'failed';
                state.error = action.error.message;
            });
    },
})

const addSecretToGroupedSecretList = (group: GroupedSecretList, secret: SecretListEntry): GroupedSecretList => {
    const newGroupedSecretList = {
        ...group
    }
    if (secret.category['Password']) {
        newGroupedSecretList.passwordList.push(mapSecretListEntry(secret, UiSecretCategory.Password))
    } else if (secret.category['Note']) {
        newGroupedSecretList.notesList.push(mapSecretListEntry(secret, UiSecretCategory.Note));
    } else if (secret.category['Document']) {
        newGroupedSecretList.documentsList.push(mapSecretListEntry(secret, UiSecretCategory.Document));
    } else {
        newGroupedSecretList.othersList.push(mapSecretListEntry(secret, undefined));
    }
    return newGroupedSecretList;
}

const mapSecretListEntry = (secret: SecretListEntry, category: UiSecretCategory): UiSecretListEntry => {
    return {
        id: secret.id,
        name: secret.name && secret.name.length > 0 ? secret.name[0]: undefined,
        category,
    }
}

const splitSecretListByCategory = (secretList: SecretListEntry[]): GroupedSecretList => {
    const passwordList: UiSecretListEntry[] = [];
    const notesList: UiSecretListEntry[] = [];
    const documentsList: UiSecretListEntry[] = [];
    const othersList: UiSecretListEntry[] = [];

    if(secretList) {
        secretList.forEach(secret => {
            secret.category.forEach(category => {
                if (category['Password']) {
                    passwordList.push(mapSecretListEntry(secret, UiSecretCategory.Password))
                } else if (category['Note']) {
                    notesList.push(mapSecretListEntry(secret, UiSecretCategory.Note));
                } else if (category['Document']) {
                    documentsList.push(mapSecretListEntry(secret, UiSecretCategory.Document));
                } else {
                    othersList.push(mapSecretListEntry(secret, undefined));
                }
            })
        })
    }

    return {
        passwordList,
        notesList,
        documentsList,
        othersList
    }
}

// Action creators are generated for each case reducer function
export const secretsActions = secretsSlice.actions;

export const secretsReducer = secretsSlice.reducer;
