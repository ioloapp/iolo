import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./secretsState";
import {SecretListEntry} from "../../../../declarations/iccrypt_backend/iccrypt_backend.did";

// Define a type for the slice state
export const secretsSlice = createSlice({
    name: 'secrets',
    initialState,
    reducers: {
        setSecretList: (state, {payload}: PayloadAction<SecretListEntry[]>) => {
            state.secretList = payload
        }
    },
})

// Action creators are generated for each case reducer function
export const secretsActions = secretsSlice.actions;

export default secretsSlice.reducer;
