import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./userState";

// Define a type for the slice state
export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        logIn: (state, {payload}: PayloadAction<String>) => {
            state.principal = payload;
        },
        logOut: (state) => {
            state.principal = undefined;
            state.userVaultExisting = undefined;
        },
        setUserVaultExisting: (state, {payload}: PayloadAction<boolean>) => {
            state.userVaultExisting = payload
        }
    },
})

// Action creators are generated for each case reducer function
export const userActions = userSlice.actions;

export default userSlice.reducer;
