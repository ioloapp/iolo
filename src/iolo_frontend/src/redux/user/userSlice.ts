import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./userState";
import IoloService from "../../services/IoloService";
import {RootState} from "../store";
import {UiUser} from "../../services/IoloTypesForUi";
import {REHYDRATE} from "redux-persist/es/constants";
import {LoginFailedException} from "../../error/Errors";

const ioloService = new IoloService();

export interface UserLogin {
    principal: string,
    userVaultExisting: boolean
}

export const loginUserThunk = createAsyncThunk<UiUser, void, { state: RootState }>(
    'user/login',
    async (_): Promise<UiUser> => {
        const principal = await ioloService.login();
        if (principal) {
            return ioloService.getCurrentUser();
        }
        throw new LoginFailedException();
    });

export const getCurrentUserThunk = createAsyncThunk<UiUser, void, { state: RootState }>(
    'user/get-current',
    async (_): Promise<UiUser> => {
            return await ioloService.getCurrentUser();
    });

export const createUserThunk = createAsyncThunk<UiUser, UiUser, { state: RootState }>(
    'user/create',
    async (uiUser: UiUser): Promise<UiUser> => {
        return await ioloService.createUser(uiUser);
    });

export const updateUserThunk = createAsyncThunk<UiUser, UiUser, { state: RootState }>(
    'user/update',
    async (uiUser: UiUser): Promise<UiUser> => {
            return await ioloService.updateUser(uiUser);
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
        },
        changeMode: (state, action: PayloadAction<'dark' | 'light'>) => {
            state.mode = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(REHYDRATE, (state) => {
                if (state.loginStatus !== 'succeeded') {
                    state.loginStatus = 'init';
                }
            })
            .addCase(loginUserThunk.pending, (state) => {
                state.loginStatus = 'pending';
            })
            .addCase(loginUserThunk.fulfilled, (state, action) => {
                state.loginStatus = 'succeeded';
                state.principal = action.payload.id;
                state.user = {
                    ...initialState.user,
                    ...action.payload
                }
                state.userVaultExisting = action.payload.dateCreated !== undefined;
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
                state.userVaultExisting = action.payload?.dateCreated != undefined;
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
