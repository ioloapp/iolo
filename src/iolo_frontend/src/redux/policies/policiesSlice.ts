import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./policiesState";
import IoloService from "../../services/IoloService";
import {RootState} from "../store";
import {
    UiCondition,
    UiPolicy,
    UiPolicyListEntry,
    UiPolicyListEntryRole,
    UiPolicyResponse
} from "../../services/IoloTypesForUi";
import {mapError} from "../../utils/errorMapper";

const ioloService = new IoloService();

export const addPolicyThunk = createAsyncThunk<UiPolicy, UiPolicy, { state: RootState }>(
    'policies/add',
    async (policy, {rejectWithValue}) => {
        try {
            return await ioloService.addPolicy(policy);
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const viewPolicyThunk = createAsyncThunk<UiPolicyResponse, UiPolicy, { state: RootState }>(
    'policies/view',
    (policy, {rejectWithValue}) => {
        try {
            if (policy.role === UiPolicyListEntryRole.Testator) {
                return ioloService.getPolicyAsOwner(policy.id);
            } else {
                return ioloService.getPolicyAsBeneficary(policy.id);
            }

        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const editPolicyThunk = createAsyncThunk<UiPolicyResponse, UiPolicy, { state: RootState }>(
    'policies/edit',
     (policy, {rejectWithValue, getState}) => {
        try {
            if (policy.role === UiPolicyListEntryRole.Testator) {
                return ioloService.getPolicyAsOwner(policy.id);
            } else {
                return ioloService.getPolicyAsBeneficary(policy.id);
            }

        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const updatePolicyThunk = createAsyncThunk<UiPolicy, UiPolicy, {
    state: RootState }
>('policies/update',
    async (policy, {rejectWithValue}) => {
        try {
            return await ioloService.updatePolicy(policy);
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);


export const deletePolicyThunk = createAsyncThunk<string, string, {
    state: RootState
}>('policies/delete',
    async (policyId, {rejectWithValue}) => {
        try {
            await ioloService.deletePolicy(policyId);
            return policyId;
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const loadPoliciesThunk = createAsyncThunk<UiPolicyListEntry[], void, {
    state: RootState
}>('policies/load',
    async (_, {rejectWithValue}) => {
        try {
            return await ioloService.getPolicyList();
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

// Define a type for the slice state
export const policiesSlice = createSlice({
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
        cancelAddPolicy: state => {
            state.dialogItem = initialState.dialogItem;
            state.showAddDialog = false;
        },
        cancelEditPolicy: state => {
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
        cancelDeletePolicy: state => {
            state.dialogItem = initialState.dialogItem;
            state.showDeleteDialog = false;
        },
        updateDialogItem: (state, action: PayloadAction<UiPolicyResponse>) => {
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
            .addCase(loadPoliciesThunk.pending, (state) => {
                state.loadingState = 'pending';
                state.error = undefined;
            })
            .addCase(loadPoliciesThunk.fulfilled, (state, action) => {
                state.loadingState = 'succeeded';
                state.policyList = action.payload
            })
            .addCase(loadPoliciesThunk.rejected, (state, action) => {
                state.loadingState = 'failed';
                state.error = action.error.message;
            })
            .addCase(addPolicyThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
                state.showAddDialog = true;
            })
            .addCase(addPolicyThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showAddDialog = false;
                state.dialogItem = initialState.dialogItem;
                state.policyList = [...state.policyList, action.payload]
            })
            .addCase(addPolicyThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
                state.showAddDialog = true;
            })
            .addCase(viewPolicyThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
                state.showViewDialog = true;
            })
            .addCase(viewPolicyThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.dialogItem = action.payload;
            })
            .addCase(viewPolicyThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            })
            .addCase(editPolicyThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
                state.showEditDialog = true;
            })
            .addCase(editPolicyThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.dialogItem = action.payload;
            })
            .addCase(editPolicyThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            })
            .addCase(updatePolicyThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
            })
            .addCase(updatePolicyThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showEditDialog = false;
                state.dialogItem = initialState.dialogItem;
                state.policyList = [...state.policyList.filter(h => h.id != action.payload.id), action.payload]
            })
            .addCase(updatePolicyThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            })
            .addCase(deletePolicyThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
            })
            .addCase(deletePolicyThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showDeleteDialog = false;
                state.policyList = [...state.policyList.filter(h => h.id != action.payload)]
            })
            .addCase(deletePolicyThunk.rejected, (state, action) => {
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
export const policiesActions = policiesSlice.actions;

export const policiesReducer = policiesSlice.reducer;