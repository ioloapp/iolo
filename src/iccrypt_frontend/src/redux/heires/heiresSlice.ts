import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./heiresState";
import IcCryptService from "../../services/IcCryptService";
import {RootState} from "../store";
import {UiTestament, UiUser} from "../../services/IcTypesForUi";

const icCryptService = new IcCryptService();

export const addHeireThunk = createAsyncThunk<any, UiUser, { state: RootState }>('heires/add',
    async (heire, {rejectWithValue}) => {
        console.log('add heire', heire)
        try {
            const result = await icCryptService.addHeire(heire);
            console.log('result', result)
            return result;
        } catch (e) {
            rejectWithValue(e)
        }
    }
);

export const loadHeiresThunk = createAsyncThunk<UiUser[], void, { state: RootState }>('heires/load',
    async (_, {rejectWithValue}) => {
        try {
            const result = await icCryptService.getHeiresList();
            console.log('result', result)
            return result;
        } catch (e) {
            rejectWithValue(e)
        }
    }
);

// Define a type for the slice state
export const heiresSlice = createSlice({
    name: 'testaments',
    initialState,
    reducers: {
        closeAddDialog: state => {
            state.showAddDialog = false
        },
        openAddDialog: state => {
            state.showAddDialog = true
        },
        cancelAddHeire: state => {
            state.heireToAdd = {};
            state.showAddDialog = false;
        },
        updateTestamentToAdd: (state, action: PayloadAction<UiTestament>) => {
            state.heireToAdd = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadHeiresThunk.pending, (state) => {
                state.loadingState = 'loading';
            })
            .addCase(loadHeiresThunk.fulfilled, (state, action) => {
                state.loadingState = 'succeeded';
                state.heiresList = action.payload
            })
            .addCase(loadHeiresThunk.rejected, (state, action) => {
                state.loadingState = 'failed';
                state.error = action.error.message;
            })
            .addCase(addHeireThunk.pending, (state) => {
                state.addState = 'loading';
                state.showAddDialog = true;
            })
            .addCase(addHeireThunk.fulfilled, (state, action) => {
                state.addState = 'succeeded';
                state.showAddDialog = false;
                state.heiresList = [...state.heiresList, action.payload]
            })
            .addCase(addHeireThunk.rejected, (state, action) => {
                state.addState = 'failed';
                state.error = action.error.message;
                state.showAddDialog = true;
            });
    },
})

// Action creators are generated for each case reducer function
export const heiresActions = heiresSlice.actions;

export const heiresReducer = heiresSlice.reducer;
