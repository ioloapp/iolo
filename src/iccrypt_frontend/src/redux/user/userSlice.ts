import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {initialState, UserState} from "./userState";
import IcCryptService from "../../services/IcCryptService";
import {RootState} from "../store";
import {UiUser} from "../../services/IcTypesForUi";

const icCryptService = new IcCryptService();
export const loginUserThunk = createAsyncThunk<UserState, void, { state: RootState }>(
    'user/login',
    async (_, {rejectWithValue}): Promise<UserState> => {
        const principal = await icCryptService.login();
        if (principal) {
            const userVaultExisting = await icCryptService.isUserVaultExisting();
            if (userVaultExisting) {
                const user = await icCryptService.updateUserLoginDate();
            }
            return {
                principal: principal.toText(),
                userVaultExisting
            }
        }
    });

export const createUserThunk = createAsyncThunk<UiUser, void, { state: RootState }>(
    'user/create',
    async (_, {rejectWithValue}): Promise<UiUser> => {
        try {
            let user =  await icCryptService.createUser();
            return user;
        } catch (e) {
            rejectWithValue(e.message);
        }
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
                state.loginStatus = 'pending';
            })
            .addCase(loginUserThunk.fulfilled, (state, action) => {
                state.loginStatus = 'succeeded';
                state.principal = action.payload.principal;
                state.user = {
                    id: action.payload.principal
                }
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
                state.userVaultExisting = action.payload.userVaultId != undefined;
            })
            .addCase(createUserThunk.rejected, (state, action) => {
                state.loginStatus = 'failed';
                state.error = action.error.message;
            });
    },
})

// Action creators are generated for each case reducer function
export const userActions = userSlice.actions;

export const userReducer = userSlice.reducer;
