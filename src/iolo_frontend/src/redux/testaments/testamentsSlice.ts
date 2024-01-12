import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./testamentsState";
import IoloService from "../../services/IoloService";
import {RootState} from "../store";
import {
    UiCondition,
    UiTestament,
    UiTestamentListEntry,
    UiTestamentListEntryRole,
    UiTestamentResponse
} from "../../services/IoloTypesForUi";
import {mapError} from "../../utils/errorMapper";

const ioloService = new IoloService();

export const addTestamentThunk = createAsyncThunk<UiTestament, UiTestament, { state: RootState }>('policies/add',
    async (uiTestament, {rejectWithValue}) => {
        try {
            return await ioloService.addTestament(uiTestament);
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const viewTestamentThunk = createAsyncThunk<UiTestamentResponse, UiTestament, { state: RootState }>('policies/view',
    (uiTestament, {rejectWithValue, getState}) => {
        try {
            if (uiTestament.role === UiTestamentListEntryRole.Testator) {
                return ioloService.getTestamentAsTestator(uiTestament.id);
            } else {
                return ioloService.getTestamentAsHeir(uiTestament.id);
            }

        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const editTestamentThunk = createAsyncThunk<UiTestamentResponse, UiTestament, { state: RootState }>('policies/edit',
     (uiTestament, {rejectWithValue, getState}) => {
        try {
            if (uiTestament.role === UiTestamentListEntryRole.Testator) {
                return ioloService.getTestamentAsTestator(uiTestament.id);
            } else {
                return ioloService.getTestamentAsHeir(uiTestament.id);
            }

        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const updateTestamentThunk = createAsyncThunk<UiTestament, UiTestament, {
    state: RootState }
>('policies/update',
    async (uiTestament, {rejectWithValue}) => {
        try {
            return await ioloService.updateTestament(uiTestament);
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);


export const deleteTestamentThunk = createAsyncThunk<string, string, {
    state: RootState
}>('policies/delete',
    async (testamentId, {rejectWithValue}) => {
        try {
            await ioloService.deleteTestament(testamentId);
            return testamentId;
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const loadTestamentsThunk = createAsyncThunk<UiTestamentListEntry[], void, {
    state: RootState
}>('policies/load',
    async (_, {rejectWithValue}) => {
        try {
            return await ioloService.getTestamentList();
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

// Define a type for the slice state
export const testamentsSlice = createSlice({
    name: 'policies',
    initialState,
    reducers: {
        closeAddDialog: state => {
            state.showAddDialog = false
        },
        closeViewDialog: state => {
            state.showViewDialog = false
        },
        closeEditDialog: state => {
            state.showEditDialog = false
        },
        openAddDialog: state => {
            state.showAddDialog = true
            state.error = undefined
        },
        cancelAddTestament: state => {
            state.dialogItem = initialState.dialogItem;
            state.showAddDialog = false;
        },
        cancelEditTestament: state => {
            state.dialogItem = initialState.dialogItem;
            state.showEditDialog = false;
        },
        openEditDialog: state => {
            state.showEditDialog = true
            state.error = undefined
        },
        openDeleteDialog: state => {
            state.showDeleteDialog = true
            state.error = undefined
        },
        closeDeleteDialog: state => {
            state.showDeleteDialog = false
            state.dialogItem = initialState.dialogItem;
        },
        cancelDeleteTestament: state => {
            state.dialogItem = initialState.dialogItem;
            state.showDeleteDialog = false;
        },
        updateDialogItem: (state, action: PayloadAction<UiTestamentResponse>) => {
            state.dialogItem = action.payload;
        },
        addConditionToDialogItem: (state, action: PayloadAction<UiCondition>) => {
            state.dialogItem = {
                ...state.dialogItem,
                conditions: [
                    ...state.dialogItem.conditions,
                    action.payload
                ],
            }
        },
        deleteConditionOfDialogItem: (state, action: PayloadAction<UiCondition>) => {
            state.dialogItem = {
                ...state.dialogItem,
                conditions: state.dialogItem.conditions.filter(c => c.id != action.payload.id)
            }
        },
        updateConditionOfDialogItem: (state, action: PayloadAction<UiCondition>) => {
            state.dialogItem = {
                ...state.dialogItem,
                conditions: replaceConditions(state.dialogItem.conditions, action.payload)
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadTestamentsThunk.pending, (state) => {
                state.loadingState = 'pending';
                state.error = undefined;
            })
            .addCase(loadTestamentsThunk.fulfilled, (state, action) => {
                state.loadingState = 'succeeded';
                state.testamentsList = action.payload
            })
            .addCase(loadTestamentsThunk.rejected, (state, action) => {
                state.loadingState = 'failed';
                state.error = action.error.message;
            })
            .addCase(addTestamentThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
                state.showAddDialog = true;
            })
            .addCase(addTestamentThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showAddDialog = false;
                state.dialogItem = initialState.dialogItem;
                state.testamentsList = [...state.testamentsList, action.payload]
            })
            .addCase(addTestamentThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
                state.showAddDialog = true;
            })
            .addCase(viewTestamentThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
                state.showViewDialog = true;
            })
            .addCase(viewTestamentThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.dialogItem = action.payload;
            })
            .addCase(viewTestamentThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            })
            .addCase(editTestamentThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
                state.showEditDialog = true;
            })
            .addCase(editTestamentThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.dialogItem = action.payload;
            })
            .addCase(editTestamentThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            })
            .addCase(updateTestamentThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
            })
            .addCase(updateTestamentThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showEditDialog = false;
                state.dialogItem = initialState.dialogItem;
                state.testamentsList = [...state.testamentsList.filter(h => h.id != action.payload.id), action.payload]
            })
            .addCase(updateTestamentThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            })
            .addCase(deleteTestamentThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
            })
            .addCase(deleteTestamentThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showDeleteDialog = false;
                state.testamentsList = [...state.testamentsList.filter(h => h.id != action.payload)]
            })
            .addCase(deleteTestamentThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            });
    },
})

export const replaceConditions = (conditions: UiCondition[], condition: UiCondition): UiCondition[] => {
    const newConditions = [];
    conditions.forEach(c => {
        if(c.id === condition.id){
            newConditions.push(condition);
        } else {
            newConditions.push(c);
        }
    })
    return newConditions;
}

// Action creators are generated for each case reducer function
export const testamentsActions = testamentsSlice.actions;

export const testamentsReducer = testamentsSlice.reducer;
