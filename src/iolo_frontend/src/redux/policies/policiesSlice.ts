import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./policiesState";
import IoloService from "../../services/IoloService";
import {RootState} from "../store";
import {
    UiCondition,
    UiPolicy,
    UiPolicyListEntry,
    UiPolicyListEntryRole,
    UiPolicyWithSecretListEntries
} from "../../services/IoloTypesForUi";

const ioloService = new IoloService();

export const addPolicyThunk = createAsyncThunk<UiPolicy, UiPolicy, { state: RootState }>(
    'policies/add',
    async (policy, {rejectWithValue, getState}) => {
        try {
            return await ioloService.createPolicy(getState(), policy);
        } catch (e) {
            console.error(e)
            return rejectWithValue(e.message)
        }
    }
);

export const viewPolicyThunk = createAsyncThunk<UiPolicyWithSecretListEntries | unknown, UiPolicy, {
    state: RootState
}>(
    'policies/view',
    async (policy, {rejectWithValue, getState}) => {
        try {
            if (policy.role === UiPolicyListEntryRole.Owner) {
                return await ioloService.getPolicyAsOwner(getState(), policy.id);
            } else if (policy.role === UiPolicyListEntryRole.Validator) {
                return await ioloService.getPolicyAsValidator(getState(), policy.id);
            } else {
                return await ioloService.getPolicyAsBeneficiary(getState(), policy.id);
            }
        } catch (e) {
            return rejectWithValue(e)
        }
    }
);

export const editPolicyThunk = createAsyncThunk<UiPolicyWithSecretListEntries, UiPolicy, { state: RootState }>(
    'policies/edit',
    async (policy, {rejectWithValue, getState}) => {
        try {
            if (policy.role === UiPolicyListEntryRole.Owner) {
                return await ioloService.getPolicyAsOwner(getState(), policy.id);
            } else {
                return await ioloService.getPolicyAsBeneficiary(getState(), policy.id);
            }

        } catch (e) {
            return rejectWithValue(e)
        }
    }
);

export const updatePolicyThunk = createAsyncThunk<UiPolicy, UiPolicy, {
    state: RootState
}
>('policies/update',
    async (policy, {rejectWithValue, getState}) => {
        try {
            return await ioloService.updatePolicy(getState(), policy);
        } catch (e) {
            return rejectWithValue(e)
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
            return rejectWithValue(e)
        }
    }
);

export const loadPoliciesThunk = createAsyncThunk<UiPolicyListEntry[], void, {
    state: RootState
}>('policies/load-list',
    async (_, {rejectWithValue, getState}) => {
        try {
            return await ioloService.getPolicyListOfUser(getState());
        } catch (e) {
            return rejectWithValue(e)
        }
    }
);

export const loadPoliciesWhereUserIsValidatorThunk = createAsyncThunk<UiPolicyListEntry[], void, {
    state: RootState
}>('policies/load-validator-list',
    async (_, {rejectWithValue, getState}) => {
        try {
            return await ioloService.getPolicyListWhereUserIsValidator(getState());
        } catch (e) {
            return rejectWithValue(e)
        }
    }
);

export const loadPoliciesWhereUserIsBeneficiaryThunk = createAsyncThunk<UiPolicyListEntry[], void, {
    state: RootState
}>('policies/load-beneficiary-list',
    async (_, {rejectWithValue, getState}) => {
        try {
            return await ioloService.getPolicyListWhereUserIsBeneficiary(getState());
        } catch (e) {
            return rejectWithValue(e)
        }
    }
);

export const confirmConditionThunk = createAsyncThunk<UiPolicy[],
    { policyId: string, conditionId: string }, {
    state: RootState
}>('policies/confirm-condition',
    async ({policyId, conditionId}, {getState, rejectWithValue}) => {
        const {policies}: RootState = getState();
        try {
            return await ioloService.confirmXOutOfYCondition(policies.policyValidatorList, policyId, conditionId, true);
        } catch (e) {
            return rejectWithValue(e)
        }
    }
);

export const declineConditionThunk = createAsyncThunk<UiPolicy[],
    { policyId: string, conditionId: string }, {
    state: RootState
}>('policies/decline-condition',
    async ({policyId, conditionId}, {getState, rejectWithValue}) => {
        const {policies}: RootState = getState();
        try {
            return await ioloService.confirmXOutOfYCondition(policies.policyValidatorList, policyId, conditionId, false);
        } catch (e) {
            return rejectWithValue(e)
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
            state.dialogItem = {...initialState.dialogItem}
            state.dialogItemState = "init"
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
        updateDialogItem: (state, action: PayloadAction<UiPolicyWithSecretListEntries>) => {
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
            .addCase(loadPoliciesThunk.rejected, (state, action: PayloadAction<any>) => {
                state.loadingState = 'failed';
                state.error = action.payload?.name ? action.payload.name : 'error';
            })
            .addCase(loadPoliciesWhereUserIsBeneficiaryThunk.pending, (state) => {
                state.loadingState = 'pending';
                state.error = undefined;
            })
            .addCase(loadPoliciesWhereUserIsBeneficiaryThunk.fulfilled, (state, action) => {
                state.loadingState = 'succeeded';
                state.policyBeneficiaryList = action.payload
            })
            .addCase(loadPoliciesWhereUserIsBeneficiaryThunk.rejected, (state, action: PayloadAction<any>) => {
                state.loadingState = 'failed';
                state.error = action.payload?.name ? action.payload.name : 'error';
            })
            .addCase(loadPoliciesWhereUserIsValidatorThunk.pending, (state) => {
                state.loadingState = 'pending';
                state.error = undefined;
            })
            .addCase(loadPoliciesWhereUserIsValidatorThunk.fulfilled, (state, action) => {
                state.loadingState = 'succeeded';
                state.policyValidatorList = action.payload
            })
            .addCase(loadPoliciesWhereUserIsValidatorThunk.rejected, (state, action: PayloadAction<any>) => {
                state.loadingState = 'failed';
                state.error = action.payload?.name ? action.payload.name : 'error';
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
            .addCase(addPolicyThunk.rejected, (state, action: PayloadAction<any>) => {
                state.dialogItemState = 'failed';
                state.error = action.payload?.name ? action.payload.name : 'error';
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
            .addCase(viewPolicyThunk.rejected, (state, action: PayloadAction<any>) => {
                state.dialogItemState = 'failed';
                state.error = action.payload?.name ? action.payload.name : 'error';
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
            .addCase(editPolicyThunk.rejected, (state, action: PayloadAction<any>) => {
                state.dialogItemState = 'failed';
                state.error = action.payload?.name ? action.payload.name : 'error';
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
            .addCase(updatePolicyThunk.rejected, (state, action: PayloadAction<any>) => {
                state.dialogItemState = 'failed';
                state.error = action.payload?.name ? action.payload.name : 'error';
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
            .addCase(deletePolicyThunk.rejected, (state, action: PayloadAction<any>) => {
                state.dialogItemState = 'failed';
                state.error = action.payload?.name ? action.payload.name : 'error';
            })
            .addCase(confirmConditionThunk.pending, (state) => {
                state.error = undefined;
            })
            .addCase(confirmConditionThunk.fulfilled, (state: RootState, action) => {
                state.policyValidatorList = action.payload;
            })
            .addCase(confirmConditionThunk.rejected, (state, action: PayloadAction<any>) => {
                state.error = action.payload?.name ? action.payload.name : 'error';
            })
            .addCase(declineConditionThunk.pending, (state) => {
                state.error = undefined;
            })
            .addCase(declineConditionThunk.fulfilled, (state: RootState, action) => {
                state.policyValidatorList = action.payload;
            })
            .addCase(declineConditionThunk.rejected, (state, action: PayloadAction<any>) => {
                state.error = action.payload?.name ? action.payload.name : 'error';
            });
    },
})

export const replaceConditions = (conditions: UiCondition[], condition: UiCondition): UiCondition[] => {
    const newConditions = [];
    conditions.forEach(c => {
        if (c.id === condition.id) {
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
