import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./userState";
import IoloService from "../../services/IoloService";
import {RootState} from "../store";
import {UiUser} from "../../services/IoloTypesForUi";
import {REHYDRATE} from "redux-persist/es/constants";
import {IoloError, LoginFailedException, UserAlreadyExists} from "../../error/Errors";

const ioloService = new IoloService();

export interface UserLogin {
    principal: string,
}

export const loginUserThunk = createAsyncThunk<UiUser, void, { state: RootState }>(
    'user/login',
    async (_, {rejectWithValue}): Promise<UiUser | unknown> => {
        const principal = await ioloService.login();
        if (principal) {
            try{
                return await ioloService.getCurrentUser(principal);
            } catch (e) {
                return rejectWithValue(e)
            }
        }
        throw new LoginFailedException();
    });

export const getCurrentUserThunk = createAsyncThunk<UiUser, void, { state: RootState }>(
    'user/get-current',
    async (_, {rejectWithValue}): Promise<UiUser | unknown> => {
        try{
            return await ioloService.getCurrentUser();
        } catch (e) {
            return rejectWithValue(e)
        }
    });

export const createUserThunk = createAsyncThunk<UiUser, UiUser, { state: RootState }>(
    'user/create',
    async (uiUser: UiUser, {rejectWithValue}): Promise<UiUser | unknown> => {
        try{
            return await ioloService.createUser(uiUser);
        } catch (e) {
            if(e instanceof UserAlreadyExists){
                try{
                    return await ioloService.getCurrentUser();
                } catch (e) {
                    return rejectWithValue(e)
                }
            }
            return rejectWithValue(e)
        }
    });

export const updateUserThunk = createAsyncThunk<UiUser, UiUser, { state: RootState }>(
    'user/update',
    async (uiUser: UiUser, {rejectWithValue}): Promise<UiUser | unknown> => {
        try{
            return await ioloService.updateUser(uiUser);
        } catch (e) {
            return rejectWithValue(e)
        }
    });

// Define a type for the slice state
export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        logOut: (state) => {
            state.principal = undefined;
            state.user = undefined;
        },
        updateUser: (state, action: PayloadAction<UiUser>) => {
            state.user = action.payload
        },
        changeMode: (state, action: PayloadAction<'dark' | 'light'>) => {
            state.mode = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
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
            })
            .addCase(loginUserThunk.rejected, (state, action: PayloadAction<any>) => {
                state.loginStatus = 'failed';
                state.error = action.payload?.name ? action.payload.name : 'error';
            })
            .addCase(createUserThunk.pending, (state) => {
                state.loginStatus = 'pending';
            })
            .addCase(createUserThunk.fulfilled, (state, action) => {
                state.loginStatus = 'succeeded';
                state.user = action.payload;
            })
            .addCase(createUserThunk.rejected, (state, action: PayloadAction<any>) => {
                state.loginStatus = 'failed';
                state.error = action.payload?.name ? action.payload.name : 'error';
            })
            .addCase(getCurrentUserThunk.pending, (state) => {
                state.loginStatus = 'pending';
            })
            .addCase(getCurrentUserThunk.fulfilled, (state, action) => {
                state.loginStatus = 'succeeded';
                state.user = action.payload;
            })
            .addCase(getCurrentUserThunk.rejected, (state, action: PayloadAction<any>) => {
                state.loginStatus = 'failed';
                state.error = action.payload?.name ? action.payload.name : 'error';
            })
            .addCase(updateUserThunk.pending, (state) => {
                state.loginStatus = 'pending';
            })
            .addCase(updateUserThunk.fulfilled, (state, action) => {
                state.loginStatus = 'succeeded';
                state.user = action.payload;
            })
            .addCase(updateUserThunk.rejected, (state, action: PayloadAction<any>) => {
                state.loginStatus = 'failed';
                state.error = action.payload?.name ? action.payload.name : 'error';
            });
    },
})

// Action creators are generated for each case reducer function
export const userActions = userSlice.actions;

export const userReducer = userSlice.reducer;
