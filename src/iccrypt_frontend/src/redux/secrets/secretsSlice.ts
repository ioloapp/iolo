import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {GroupedSecretList, initialState} from "./secretsState";
import {SecretListEntry} from "../../../../declarations/iccrypt_backend/iccrypt_backend.did";
import IcCryptService from "../../services/IcCryptService";
import {RootState} from "../store";
import {UiSecret} from "../../services/IcTypesForUi";

const icCryptService = new IcCryptService();

export const addSecretThunk = createAsyncThunk<SecretListEntry[], UiSecret, { state: RootState }>('secrets/add',
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
    reducers: {},
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
                state.secretList = splitSecretListByCategory(action.payload)
            })
            .addCase(addSecretThunk.rejected, (state, action) => {
                state.addState = 'failed';
                state.error = action.error.message;
            });
    },
})

const splitSecretListByCategory = (secretList: SecretListEntry[]): GroupedSecretList => {
    const passwordList: SecretListEntry[] = [];
    const notesList: SecretListEntry[] = [];
    const documentsList: SecretListEntry[] = [];
    const othersList: SecretListEntry[] = [];

    if(secretList) {
        secretList.forEach(secret => {
            secret.category.forEach(category => {
                if (category['Password']) {
                    passwordList.push()
                } else if (category['Note']) {
                    notesList.push(secret);
                } else if (category['Document']) {
                    documentsList.push(secret);
                } else {
                    othersList.push(secret);
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
