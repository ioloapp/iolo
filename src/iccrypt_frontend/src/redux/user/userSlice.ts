import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {initialState, UserState} from "./userState";
import IcCryptService from "../../services/IcCryptService";
import {User} from "../../../../declarations/iccrypt_backend/iccrypt_backend.did";

const icCryptService = new IcCryptService();
export const loginUserThunk = createAsyncThunk('user/login', async (userId): Promise<UserState> => {
    const principal = await icCryptService.login();
    if(principal){
        const userVaultExisting = await icCryptService.isUserVaultExisting()
        return {
            principal: principal.toText(),
            userVaultExisting
        }
    }
});

export const createUserThunk = createAsyncThunk('user/create', async (userId): Promise<User> => {
    return icCryptService.createUser();
});

// Define a type for the slice state
export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        logOut: (state) => {
            state.principal = undefined;
            state.userVaultExisting = undefined;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUserThunk.pending, (state) => {
                state.loginStatus = 'loading';
            })
            .addCase(loginUserThunk.fulfilled, (state, action) => {
                state.loginStatus = 'succeeded';
                state.principal = action.payload.principal;
                state.userVaultExisting = action.payload.userVaultExisting;
            })
            .addCase(loginUserThunk.rejected, (state, action) => {
                state.loginStatus = 'failed';
                state.error = action.error.message;
            })
            .addCase(createUserThunk.pending, (state) => {
                state.loginStatus = 'creating';
            })
            .addCase(createUserThunk.fulfilled, (state, action) => {
                state.loginStatus = 'succeeded';
                state.userVaultExisting = action.payload.user_vault_id != undefined;
            })
            .addCase(createUserThunk.rejected, (state, action) => {
                state.loginStatus = 'failed';
                state.error = action.error.message;
            });
        ;
    },
})

// Action creators are generated for each case reducer function
export const userActions = userSlice.actions;

export default userSlice.reducer;
