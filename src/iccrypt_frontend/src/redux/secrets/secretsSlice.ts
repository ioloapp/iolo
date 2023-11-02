import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {GroupedSecretList, initialState} from "./secretsState";
import IcCryptService from "../../services/IcCryptService";
import {RootState} from "../store";
import {UiSecret, UiSecretCategory, UiSecretListEntry} from "../../services/IcTypesForUi";
import {mapError} from "../../utils/errorMapper";

const icCryptService = new IcCryptService();

export const addSecretThunk = createAsyncThunk<UiSecret, UiSecret, {
    state: RootState
}>('secrets/add',
    async (uiSecret: UiSecret, {rejectWithValue}) => {
        try {
            return await icCryptService.addSecret(uiSecret);
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const getSecretThunk = createAsyncThunk<UiSecret, string, {
    state: RootState
}>('secrets/get',
    async (secretId: string, {rejectWithValue}) => {
        try {
            return await icCryptService.getSecret(secretId);
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);
export interface GetSecret {
    secretId: string,
    testamentId?: string
}
export const getSecretInViewModeThunk = createAsyncThunk<UiSecret, GetSecret, {
    state: RootState
}>('secrets/getView',
    async (getSecret: GetSecret, {rejectWithValue}) => {
        try {
            if (getSecret.testamentId) {
                return await icCryptService.getSecretAsHeir(getSecret.secretId, getSecret.testamentId);
            } else {
                return await icCryptService.getSecret(getSecret.secretId);
            }

        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const updateSecretThunk = createAsyncThunk<UiSecret, UiSecret, {
    state: RootState
}>('secrets/update',
    async (uiSecret: UiSecret, {rejectWithValue}) => {
        try {
            return await icCryptService.updateSecret(uiSecret);
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const deleteSecretThunk = createAsyncThunk<string, UiSecret, {
    state: RootState
}>('secrets/delete',
    async (uiSecret, {rejectWithValue}) => {
        try {
            await icCryptService.deleteSecret(uiSecret.id);
            return uiSecret.id;
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const loadSecretsThunk = createAsyncThunk<UiSecretListEntry[], void, {
    state: RootState
}>('secrets/load',
    async (_, {rejectWithValue}) => {
        try {
            return await icCryptService.getSecretList();
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

// Define a type for the slice state
export const secretsSlice = createSlice({
    name: 'secrets',
    initialState,
    reducers: {
        closeAddOrEditDialog: state => {
            state.showAddDialog = false;
            state.showEditDialog = false;
            state.dialogItem = initialState.dialogItem;
        },
        openAddDialog: state => {
            state.showAddDialog = true
            state.dialogItem = initialState.dialogItem;
            state.error = undefined;
        },
        openEditDialog: state => {
            state.showEditDialog = true
            state.error = undefined;
        },
        cancelAddSecret: state => {
            state.showAddDialog = false;
            state.dialogItem = initialState.dialogItem;
        },
        cancelEditSecret: state => {
            state.showEditDialog = false;
            state.dialogItem = initialState.dialogItem;
        },
        openDeleteDialog: state => {
            state.showDeleteDialog = true
            state.error = undefined;
        },
        closeDeleteDialog: state => {
            state.showDeleteDialog = false
            state.dialogItem = initialState.dialogItem;
        },
        cancelDeleteSecret: state => {
            state.dialogItem = initialState.dialogItem;
            state.showDeleteDialog = false;
        },
        updateDialogItem: (state, action) => {
            state.dialogItem = action.payload;
        },
        openViewDialog: state => {
            state.showViewDialog = true
            state.error = undefined;
        },
        closeViewDialog: state => {
            state.showViewDialog = false
            state.error = undefined;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadSecretsThunk.pending, (state) => {
                state.listItemsState = 'pending';
                state.error = undefined;
            })
            .addCase(loadSecretsThunk.fulfilled, (state, action) => {
                state.listItemsState = 'succeeded';
                state.groupedSecretList = splitSecretListByCategory(action.payload);
            })
            .addCase(loadSecretsThunk.rejected, (state, action) => {
                state.listItemsState = 'failed';
                state.error = action.error.message;
            })
            .addCase(addSecretThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
            })
            .addCase(addSecretThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showAddDialog = false;
                state.dialogItem = initialState.dialogItem;
                state.groupedSecretList = addSecretToGroupedSecretList(state.groupedSecretList, action.payload)
            })
            .addCase(addSecretThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            })
            .addCase(getSecretThunk.pending, (state) => {
                state.showAddDialog = false;
                state.showEditDialog = true;
                state.dialogItemState = 'pending';
                state.dialogItem = initialState.dialogItem;
                state.error = undefined;
            })
            .addCase(getSecretThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.dialogItem = action.payload;
                state.showAddDialog = false;
                state.showEditDialog = true;
            })
            .addCase(getSecretThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
                state.showAddDialog = false;
                state.showEditDialog = false;
            })
            .addCase(getSecretInViewModeThunk.pending, (state) => {
                state.showViewDialog = true;
                state.dialogItem = initialState.dialogItem;
                state.dialogItemState = 'pending';
                state.error = undefined;
            })
            .addCase(getSecretInViewModeThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.dialogItem = action.payload;
            })
            .addCase(getSecretInViewModeThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            })
            .addCase(updateSecretThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
            })
            .addCase(updateSecretThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showEditDialog = false;
                state.dialogItem = initialState.dialogItem;
                state.groupedSecretList = updateSecretInGroupedSecretList(state.groupedSecretList, action.payload)
            })
            .addCase(updateSecretThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            })
            .addCase(deleteSecretThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
            })
            .addCase(deleteSecretThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showDeleteDialog = false;
                state.groupedSecretList = removeSecretFromGroupedSecretList(state.groupedSecretList, action.payload)
            })
            .addCase(deleteSecretThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            });
    },
})

const updateSecretInGroupedSecretList = (group: GroupedSecretList, uiSecret: UiSecret): GroupedSecretList => {
    const newGroupedSecretList = {
        ...group
    }
    if (uiSecret.category === UiSecretCategory.Password) {
        newGroupedSecretList.passwordList = newGroupedSecretList.passwordList.filter(s => s.id != uiSecret.id);
        newGroupedSecretList.passwordList.push(uiSecret)
    } else if (uiSecret.category === UiSecretCategory.Note) {
        newGroupedSecretList.notesList = newGroupedSecretList.notesList.filter(s => s.id != uiSecret.id);
        newGroupedSecretList.notesList.push(uiSecret);
    } else if (uiSecret.category === UiSecretCategory.Document) {
        newGroupedSecretList.documentsList = newGroupedSecretList.documentsList.filter(s => s.id != uiSecret.id);
        newGroupedSecretList.documentsList.push(uiSecret);
    } else {
        newGroupedSecretList.othersList = newGroupedSecretList.othersList.filter(s => s.id != uiSecret.id);
        newGroupedSecretList.othersList.push(uiSecret);
    }
    return newGroupedSecretList;
}

const removeSecretFromGroupedSecretList = (group: GroupedSecretList, secretId: string): GroupedSecretList => {
    const newGroupedSecretList = {
        ...group
    }
    newGroupedSecretList.passwordList = newGroupedSecretList.passwordList.filter(s => s.id != secretId);
    newGroupedSecretList.notesList = newGroupedSecretList.notesList.filter(s => s.id != secretId);
    newGroupedSecretList.documentsList = newGroupedSecretList.documentsList.filter(s => s.id != secretId);
    newGroupedSecretList.othersList = newGroupedSecretList.othersList.filter(s => s.id != secretId);
    return newGroupedSecretList;
}

const addSecretToGroupedSecretList = (group: GroupedSecretList, uiSecret: UiSecret): GroupedSecretList => {
    const newGroupedSecretList = {
        ...group
    }

    if (uiSecret.category === UiSecretCategory.Password) {
        newGroupedSecretList.passwordList.push(uiSecret)
    } else if (uiSecret.category === UiSecretCategory.Note) {
        newGroupedSecretList.notesList.push(uiSecret);
    } else if (uiSecret.category === UiSecretCategory.Document) {
        newGroupedSecretList.documentsList.push(uiSecret);
    } else {
        newGroupedSecretList.othersList.push(uiSecret);
    }
    return newGroupedSecretList;
}

const splitSecretListByCategory = (uiSecretList: UiSecretListEntry[]): GroupedSecretList => {
    const passwordList: UiSecretListEntry[] = [];
    const notesList: UiSecretListEntry[] = [];
    const documentsList: UiSecretListEntry[] = [];
    const othersList: UiSecretListEntry[] = [];

    if (uiSecretList) {
        uiSecretList.forEach(uiSecretListEntry => {
            if (uiSecretListEntry.category === UiSecretCategory.Password) {
                passwordList.push(uiSecretListEntry)
            } else if (uiSecretListEntry.category === UiSecretCategory.Note) {
                notesList.push(uiSecretListEntry);
            } else if (uiSecretListEntry.category === UiSecretCategory.Document) {
                documentsList.push(uiSecretListEntry);
            } else {
                othersList.push(uiSecretListEntry);
            }
        })
    }

    return {
        passwordList,
        notesList,
        documentsList,
        othersList
    }
}

// Action creators are generated for each case reducer function
export const secretsActions = secretsSlice.actions;

export const secretsReducer = secretsSlice.reducer;
