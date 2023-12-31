import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./heirsState";
import IoloService from "../../services/IoloService";
import {RootState} from "../store";
import {UiUser} from "../../services/IoloTypesForUi";
import {mapError} from "../../utils/errorMapper";

const ioloService = new IoloService();

export const addHeirThunk = createAsyncThunk<UiUser, UiUser, {
    state: RootState }
>('heirs/add',
    async (heir, {rejectWithValue}) => {
        try {
            return await ioloService.addHeir(heir);
        } catch (e) {
            rejectWithValue(e)
        }
    }
);

export const updateHeirThunk = createAsyncThunk<UiUser, UiUser, {
    state: RootState }
>('heirs/update',
    async (heir, {rejectWithValue}) => {
        try {
            return await ioloService.updateHeir(heir);
        } catch (e) {
            rejectWithValue(e)
        }
    }
);

export const deleteHeirThunk = createAsyncThunk<string, UiUser, {
    state: RootState
}>('heirs/delete',
    async (heir, {rejectWithValue}) => {
        try {
            await ioloService.deleteHeir(heir.id);
            return heir.id;
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const loadHeirsThunk = createAsyncThunk<UiUser[], void, {
    state: RootState }
>('heirs/load',
    async (_, {rejectWithValue}) => {
        try {
            return await ioloService.getHeirsList();
        } catch (e) {
            rejectWithValue(e)
        }
    }
);

// Define a type for the slice state
export const heirsSlice = createSlice({
    name: 'heirs',
    initialState,
    reducers: {
        closeAddDialog: state => {
            state.showAddDialog = false
        },
        openAddDialog: state => {
            state.showAddDialog = true
            state.error = undefined;
        },
        cancelAddHeir: state => {
            state.dialogItem = initialState.dialogItem;
            state.showAddDialog = false;
        },
        cancelEditHeir: state => {
            state.dialogItem = initialState.dialogItem;
            state.showEditDialog = false;
        },
        openEditDialog: state => {
            state.showEditDialog = true
            state.error = undefined;
        },
        openDeleteDialog: state => {
            state.showDeleteDialog = true
            state.error = undefined;
        },
        closeDeleteDialog: state => {
            state.showDeleteDialog = false
            state.dialogItem = initialState.dialogItem;
        },
        cancelDeleteHeir: state => {
            state.dialogItem = initialState.dialogItem;
            state.showDeleteDialog = false;
        },
        updateHeirToAdd: (state, action: PayloadAction<UiUser>) => {
            state.dialogItem = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadHeirsThunk.pending, (state) => {
                state.loadingState = 'pending';
                state.error = undefined;
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
                state.dialogItemState = 'pending';
                state.error = undefined;
                state.showAddDialog = true;
            })
            .addCase(addHeirThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showAddDialog = false;
                state.dialogItem = initialState.dialogItem;
                if(action.payload) {
                    state.heirsList = [...state.heirsList, action.payload]
                }
            })
            .addCase(addHeirThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
                state.showAddDialog = true;
            })
            .addCase(updateHeirThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
            })
            .addCase(updateHeirThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showEditDialog = false;
                state.dialogItem = initialState.dialogItem;
                if(action.payload) {
                    state.heirsList = [...state.heirsList.filter(h => h.id != action.payload.id), action.payload]
                }
            })
            .addCase(updateHeirThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            })
            .addCase(deleteHeirThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
            })
            .addCase(deleteHeirThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showDeleteDialog = false;
                if(action.payload) {
                    state.heirsList = [...state.heirsList.filter(h => h.id != action.payload)]
                }
            })
            .addCase(deleteHeirThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            });
    },
})

// Action creators are generated for each case reducer function
export const heirsActions = heirsSlice.actions;

export const heirsReducer = heirsSlice.reducer;
