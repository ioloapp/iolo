import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./userState";
import IoloService from "../../services/IoloService";
import {RootState} from "../store";
import {UiUser} from "../../services/IoloTypesForUi";

const ioloService = new IoloService();

export interface UserLogin {
    principal: string,
    userVaultExisting: boolean
}

export const loginUserThunk = createAsyncThunk<UserLogin, void, { state: RootState }>(
    'user/login',
    async (_, {rejectWithValue}): Promise<UserLogin> => {
        const principal = await ioloService.login();
        if (principal) {
            const userVaultExisting = await ioloService.isUserVaultExisting();
            if (userVaultExisting) {
                const user = await ioloService.updateUserLoginDate();
            }
            return {
                principal: principal.toText(),
                userVaultExisting
            }
        }
    });

export const getCurrentUserThunk = createAsyncThunk<UiUser, void, { state: RootState }>(
    'user/get-current',
    async (_, {rejectWithValue}): Promise<UiUser> => {
        try {
            return await ioloService.getCurrentUser();
        } catch (e) {
            rejectWithValue(e.message);
        }
    });

export const createUserThunk = createAsyncThunk<UiUser, UiUser, { state: RootState }>(
    'user/create',
    async (uiUser: UiUser, {rejectWithValue}): Promise<UiUser> => {
        try {
            return await ioloService.createUser(uiUser);
        } catch (e) {
            rejectWithValue(e.message);
        }
    });

export const updateUserThunk = createAsyncThunk<UiUser, UiUser, { state: RootState }>(
    'user/update',
    async (uiUser: UiUser, {rejectWithValue}): Promise<UiUser> => {
        try {
            return await ioloService.updateUser(uiUser);
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
        },
        updateUser: (state, action: PayloadAction<UiUser>) => {
            state.user = action.payload
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
                    ...initialState.user,
                    id: action.payload.principal
                }
                state.userVaultExisting = action.payload.userVaultExisting;
            })
            .addCase(loginUserThunk.rejected, (state, action) => {
                state.loginStatus = 'failed';
                state.error = action.error.message;
            })
            .addCase(createUserThunk.pending, (state) => {
                state.loginStatus = 'pending';
            })
            .addCase(createUserThunk.fulfilled, (state, action) => {
                state.loginStatus = 'succeeded';
                state.userVaultExisting = action.payload?.userVaultId != undefined;
                state.user = action.payload;
            })
            .addCase(createUserThunk.rejected, (state, action) => {
                state.loginStatus = 'failed';
                state.error = action.error.message;
            })
            .addCase(getCurrentUserThunk.pending, (state) => {
                state.loginStatus = 'pending';
            })
            .addCase(getCurrentUserThunk.fulfilled, (state, action) => {
                state.loginStatus = 'succeeded';
                state.user = action.payload;
            })
            .addCase(getCurrentUserThunk.rejected, (state, action) => {
                state.loginStatus = 'failed';
                state.error = action.error.message;
            })
            .addCase(updateUserThunk.pending, (state) => {
                state.loginStatus = 'pending';
            })
            .addCase(updateUserThunk.fulfilled, (state, action) => {
                state.loginStatus = 'succeeded';
                state.user = action.payload;
            })
            .addCase(updateUserThunk.rejected, (state, action) => {
                state.loginStatus = 'failed';
                state.error = action.error.message;
            });
    },
})

// Action creators are generated for each case reducer function
export const userActions = userSlice.actions;

export const userReducer = userSlice.reducer;
