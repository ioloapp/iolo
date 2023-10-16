import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./testamentsState";
import {Testament} from "../../../../declarations/iccrypt_backend/iccrypt_backend.did";
import IcCryptService from "../../services/IcCryptService";
import {RootState} from "../store";
import {UiSecretListEntry, UiTestament, UiUser} from "../../services/IcTypesForUi";
import {Principal} from "@dfinity/principal";
import {mapError} from "../../utils/errorMapper";
import {deleteHeirThunk, updateHeirThunk} from "../heirs/heirsSlice";

const icCryptService = new IcCryptService();

export const addTestamentThunk = createAsyncThunk<UiTestament, UiTestament, { state: RootState }>('testaments/add',
    async (testament, {rejectWithValue}) => {
        console.log('add testament', testament)
        try {
            const mappedTestament = mapTestament(testament);
            const result = await icCryptService.addTestament(testament);
            console.log('result', result)
            return {
                ...testament,
                id: result?.id,
                date_created: result?.date_created ? new Date(result?.date_created.toString()) : new Date(),
                date_modified: result?.date_modified ? new Date(result?.date_modified.toString()) : new Date()
            } as UiTestament;
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const updateTestamentThunk = createAsyncThunk<UiTestament, UiTestament, { state: RootState }>('testaments/update',
    async (testament, {rejectWithValue}) => {
        console.log('update testament', testament)
        try {
            const mappedTestament = mapTestament(testament);
            const result = await icCryptService.updateTestament(mappedTestament);
            console.log('result', result)
            return {
                ...testament,
                id: result?.id,
                date_created: result?.date_created ? new Date(result?.date_created.toString()) : new Date(),
                date_modified: result?.date_modified ? new Date(result?.date_modified.toString()) : new Date()
            } as UiTestament;
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);


export const deleteTestamentThunk = createAsyncThunk<string, UiTestament, {
    state: RootState
}>('testaments/delete',
    async (testament, {rejectWithValue}) => {
        console.log('delete testaments', testament)
        try {
            await icCryptService.deleteTestament(testament.id);
            return testament.id;
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);


export interface LoadTestamentResult {
    testaments?: Testament[],
    heirs?: UiUser[],
    secrets?: UiSecretListEntry[]
}

export const loadTestamentsThunk = createAsyncThunk<LoadTestamentResult, void, { state: RootState }>('testaments/load',
    async (_, {getState}) => {
        const result = await icCryptService.getTestamentList();
        console.log('loaded testament', result)
        getState().heirs
        return {
            testaments: result,
            heirs: getState().heirs.heirsList,
            secrets: getState().secrets.secretList
        } as LoadTestamentResult;
    }
);

function mapTestament(testament: UiTestament): Testament {
    return {
        id: testament.id,
        heirs: testament.heirs.map(heir => Principal.fromText(heir.id)),
        name: [testament.name],
        testator: Principal.fromText(testament.testator.id),
        secrets: testament.secrets.map(secret => secret),
        date_modified: testament.date_modified ? BigInt(testament.date_modified.getTime()): BigInt(Date.now()),
        date_created: testament.date_modified ? BigInt(testament.date_created.getTime()): BigInt(Date.now()),
        key_box: []
    };
}

function mapUiTestaments(result: LoadTestamentResult): UiTestament[] {
    return result.testaments.map(testament => {
        return {
            id: `${testament.id}`,
            heirs: testament.heirs.map(heir => result.heirs.find(h => h.id === heir.toString())),
            name: testament.name && testament.name.length > 0 ? testament.name[0] : undefined,
            testator: result.heirs.find(h => h.id === testament.testator.toString()),
            secrets: testament.secrets.map(s => result.secrets.find(rs => rs.id === s)),
            date_modified: new Date(testament.date_modified.toString()),
            date_created: new Date(testament.date_created.toString())
        } as UiTestament
    });
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
        cancelAddOrEditTestament: state => {
            state.testamentToAdd = initialState.testamentToAdd;
            state.showAddDialog = false;
            state.showEditDialog = false;
        },
        openEditDialog: state => {
            state.showEditDialog = true
        },
        openDeleteDialog: state => {
            state.showDeleteDialog = true
        },
        closeDeleteDialog: state => {
            state.showDeleteDialog = false
            state.testamentToAdd = initialState.testamentToAdd;
        },
        cancelDeleteTestament: state => {
            state.testamentToAdd = initialState.testamentToAdd;
            state.showDeleteDialog = false;
        },
        updateTestamentToAdd: (state, action: PayloadAction<UiTestament>) => {
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
                state.testamentsList = mapUiTestaments(action.payload)
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
                state.testamentToAdd = initialState.testamentToAdd;
                state.testamentsList = [...state.testamentsList, action.payload]
            })
            .addCase(addTestamentThunk.rejected, (state, action) => {
                state.addState = 'failed';
                state.error = action.error.message;
                state.showAddDialog = true;
            })
            .addCase(updateHeirThunk.pending, (state) => {
                state.addState = 'loading';
            })
            .addCase(updateHeirThunk.fulfilled, (state, action) => {
                state.addState = 'succeeded';
                state.showEditDialog = false;
                state.testamentToAdd = initialState.testamentToAdd;
                state.testamentsList = [...state.testamentsList.filter(h => h.id != action.payload.id), action.payload]
            })
            .addCase(updateHeirThunk.rejected, (state, action) => {
                state.addState = 'failed';
                state.error = action.error.message;
            })
            .addCase(deleteHeirThunk.pending, (state) => {
                state.addState = 'loading';
            })
            .addCase(deleteHeirThunk.fulfilled, (state, action) => {
                state.addState = 'succeeded';
                state.showDeleteDialog = false;
                state.testamentsList = [...state.testamentsList.filter(h => h.id != action.payload)]
            })
            .addCase(deleteHeirThunk.rejected, (state, action) => {
                state.addState = 'failed';
                state.error = action.error.message;
            });
    },
})

// Action creators are generated for each case reducer function
export const testamentsActions = testamentsSlice.actions;

export const testamentsReducer = testamentsSlice.reducer;
