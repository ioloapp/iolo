import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./secretsState";
import {Secret, SecretListEntry} from "../../../../declarations/iccrypt_backend/iccrypt_backend.did";
import IcCryptService from "../../services/IcCryptService";
import {RootState} from "../store";

const icCryptService = new IcCryptService();

export const addSecretThunk = createAsyncThunk<SecretListEntry[], Secret, {state: RootState}>('secrets/add',
    async (secret) => {
        console.log('add secret', secret)
        const result = await icCryptService.addSecret(secret);
        console.log('result', result)
        return result;
    }
);

// Define a type for the slice state
export const secretsSlice = createSlice({
    name: 'secrets',
    initialState,
    reducers: {
        setSecretList: (state, {payload}: PayloadAction<SecretListEntry[]>) => {
            state.secretList = payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(addSecretThunk.pending, (state) => {
                state.loginStatus = 'loading';
            })
            .addCase(addSecretThunk.fulfilled, (state, action) => {
                state.loginStatus = 'succeeded';
                state.secretList = action.payload
            })
            .addCase(addSecretThunk.rejected, (state, action) => {
                state.loginStatus = 'failed';
                state.error = action.error.message;
            });
    },
})

// Action creators are generated for each case reducer function
export const secretsActions = secretsSlice.actions;

export const secretsReducer = secretsSlice.reducer;
