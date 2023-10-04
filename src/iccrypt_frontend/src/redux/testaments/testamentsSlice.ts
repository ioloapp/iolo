import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {initialState} from "./testamentsState";
import {Testament} from "../../../../declarations/iccrypt_backend/iccrypt_backend.did";
import IcCryptService from "../../services/IcCryptService";
import {RootState} from "../store";
import {UiTestament} from "../../services/IcTypesForUi";
import {Principal} from "@dfinity/principal";

const icCryptService = new IcCryptService();

export const addTestamentThunk = createAsyncThunk<Testament, UiTestament, { state: RootState }>('testaments/add',
    async (testament, {rejectWithValue}) => {
        console.log('add testament', testament)
        try {
            const result = await icCryptService.addTestament(mapTestament(testament));
            console.log('result', result)
            return result;
        } catch (e) {
            rejectWithValue(e)
        }
    }
);

export const loadTestamentsThunk = createAsyncThunk<Testament[], void, { state: RootState }>('testaments/load',
    async () => {
        const result = await icCryptService.getTestamentList();
        console.log('loaded testament', result)
        return result;
    }
);

function mapTestament(testament: UiTestament): Testament {
    return {
        id: BigInt(testament.id),
        heirs: testament.heirs.map(heire => Principal.fromText(heire)),
        name: [testament.name],
        testator: Principal.fromText(testament.testator),
        secrets: testament.secrets,
        date_modified: BigInt(testament.date_modified.getTime()),
        date_created: BigInt(testament.date_created.getTime()),
        key_box: []
    };
}

function mapUiTestament(testament: Testament): UiTestament {
    return {
        id: `${testament.id}`,
        heirs: testament.heirs.map(heire => heire.toString()),
        name: testament.name && testament.name.length > 0 ? testament.name[0] : undefined,
        testator: testament.testator.toString(),
        secrets: testament.secrets,
        date_modified: new Date(testament.date_modified.toString()),
        date_created: new Date(testament.date_created.toString())
    };
}

// Define a type for the slice state
export const testamentsSlice = createSlice({
    name: 'testaments',
    initialState,
    reducers: {
        closeAddDialog: state => {
            state.showAddDialog = false
        },
        openAddDialog: state => {
            state.showAddDialog = true
        },
        cancelAddTestament: state => {
            state.testamentToAdd = {};
            state.showAddDialog = false;
        },
        updateTestamentToAdd: (state, action) => {
            state.testamentToAdd = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadTestamentsThunk.pending, (state) => {
                state.loadingState = 'loading';
            })
            .addCase(loadTestamentsThunk.fulfilled, (state, action) => {
                state.loadingState = 'succeeded';
                state.testamentsList = action.payload.map(t => mapUiTestament(t))
            })
            .addCase(loadTestamentsThunk.rejected, (state, action) => {
                state.loadingState = 'failed';
                state.error = action.error.message;
            })
            .addCase(addTestamentThunk.pending, (state) => {
                state.addState = 'loading';
                state.showAddDialog = true;
            })
            .addCase(addTestamentThunk.fulfilled, (state, action) => {
                state.addState = 'succeeded';
                state.showAddDialog = false;
                state.testamentsList = [...state.testamentsList, mapUiTestament(action.payload)]
            })
            .addCase(addTestamentThunk.rejected, (state, action) => {
                state.addState = 'failed';
                state.error = action.error.message;
                state.showAddDialog = true;
            });
    },
})

// Action creators are generated for each case reducer function
export const testamentsActions = testamentsSlice.actions;

export const testamentsReducer = testamentsSlice.reducer;
