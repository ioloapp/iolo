import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./heirsState";
import IcCryptService from "../../services/IcCryptService";
import {RootState} from "../store";
import {UiUser} from "../../services/IcTypesForUi";

const icCryptService = new IcCryptService();

export const addHeirThunk = createAsyncThunk<UiUser, UiUser, { state: RootState }>('heirs/add',
    async (heir, {rejectWithValue}) => {
        console.log('add heir', heir)
        try {
            const result = await icCryptService.addHeir(heir);
            console.log('result', result)
            return result;
        } catch (e) {
            rejectWithValue(e)
        }
    }
);

export const loadHeirsThunk = createAsyncThunk<UiUser[], void, { state: RootState }>('heirs/load',
    async (_, {rejectWithValue}) => {
        try {
            const result = await icCryptService.getHeirsList();
            console.log('result', result)
            return result;
        } catch (e) {
            rejectWithValue(e)
        }
    }
);

// Define a type for the slice state
export const heirsSlice = createSlice({
    name: 'testaments',
    initialState,
    reducers: {
        closeAddDialog: state => {
            state.showAddDialog = false
        },
        openAddDialog: state => {
            state.showAddDialog = true
        },
        cancelAddHeir: state => {
            state.heirToAdd = {};
            state.showAddDialog = false;
        },
        updateHeirToAdd: (state, action: PayloadAction<UiUser>) => {
            state.heirToAdd = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadHeirsThunk.pending, (state) => {
                state.loadingState = 'loading';
            })
            .addCase(loadHeirsThunk.fulfilled, (state, action) => {
                state.loadingState = 'succeeded';
                state.heirsList = action.payload
            })
            .addCase(loadHeirsThunk.rejected, (state, action) => {
                state.loadingState = 'failed';
                state.error = action.error.message;
            })
            .addCase(addHeirThunk.pending, (state) => {
                state.addState = 'loading';
                state.showAddDialog = true;
            })
            .addCase(addHeirThunk.fulfilled, (state, action) => {
                state.addState = 'succeeded';
                state.showAddDialog = false;
                state.heirToAdd = {};
                state.heirsList = [...state.heirsList, action.payload]
            })
            .addCase(addHeirThunk.rejected, (state, action) => {
                state.addState = 'failed';
                state.error = action.error.message;
                state.showAddDialog = true;
            });
    },
})

// Action creators are generated for each case reducer function
export const heirsActions = heirsSlice.actions;

export const heirsReducer = heirsSlice.reducer;
