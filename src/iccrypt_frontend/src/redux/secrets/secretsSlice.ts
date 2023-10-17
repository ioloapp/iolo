import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {GroupedSecretList, initialState} from "./secretsState";
import {Secret, SecretCategory, SecretListEntry} from "../../../../declarations/iccrypt_backend/iccrypt_backend.did";
import IcCryptService from "../../services/IcCryptService";
import {RootState} from "../store";
import {UiSecret, UiSecretCategory, UiSecretListEntry} from "../../services/IcTypesForUi";
import {mapError} from "../../utils/errorMapper";

const icCryptService = new IcCryptService();

export const addSecretThunk = createAsyncThunk<Secret, UiSecret, {
    state: RootState
}>('secrets/add',
    async (uiSecret: UiSecret, {rejectWithValue}) => {
        try {
            const result: Secret = await icCryptService.addSecret(uiSecret);
            console.log('result', result)
            return result;
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const updateSecretThunk = createAsyncThunk<Secret, UiSecret, {
    state: RootState
}>('secrets/update',
    async (secret: UiSecret, {rejectWithValue}) => {
        try {
            const result: Secret = await icCryptService.updateSecret(secret);
            console.log('result', result)
            return result;
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const deleteSecretThunk = createAsyncThunk<string, UiSecret, {
    state: RootState
}>('secrets/delete',
    async (secret, {rejectWithValue}) => {
        try {
            await icCryptService.deleteSecret(secret.id);
            return secret.id;
        } catch (e) {
            rejectWithValue(mapError(e))
        }
    }
);

export const loadSecretsThunk = createAsyncThunk<SecretListEntry[], void, {
    state: RootState
}>('secrets/load',
    async () => {
        const result = await icCryptService.getSecretList();
        console.log('loaded secrets', result)
        return result;
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
            state.secretToAdd = {...initialState.secretToAdd};
        },
        openAddDialog: state => {
            state.showAddDialog = true
            state.secretToAdd = {...initialState.secretToAdd};
        },
        openEditDialog: state => {
            state.showEditDialog = true
        },
        cancelAddSecret: state => {
            state.showAddDialog = false;
            state.showEditDialog = false;
            state.secretToAdd = {...initialState.secretToAdd};
        },
        openDeleteDialog: state => {
            state.showDeleteDialog = true
        },
        closeDeleteDialog: state => {
            state.showDeleteDialog = false
            state.secretToAdd = {...initialState.secretToAdd};
        },
        cancelDeleteSecret: state => {
            state.secretToAdd = {...initialState.secretToAdd};
            state.showDeleteDialog = false;
        },
        updateSecretToAdd: (state, action) => {
            state.secretToAdd = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadSecretsThunk.pending, (state) => {
                state.loadingState = 'loading';
            })
            .addCase(loadSecretsThunk.fulfilled, (state, action) => {
                state.loadingState = 'succeeded';
                state.groupedSecretList = splitSecretListByCategory(action.payload);
                state.secretList = [...state.groupedSecretList.passwordList, ...state.groupedSecretList.notesList, ...state.groupedSecretList.othersList, ...state.groupedSecretList.documentsList]
            })
            .addCase(loadSecretsThunk.rejected, (state, action) => {
                state.loadingState = 'failed';
                state.error = action.error.message;
            })
            .addCase(addSecretThunk.pending, (state) => {
                state.addState = 'loading';
            })
            .addCase(addSecretThunk.fulfilled, (state, action) => {
                state.addState = 'succeeded';
                state.showAddDialog = false;
                state.secretToAdd = {};
                state.groupedSecretList = addSecretToGroupedSecretList(state.groupedSecretList, action.payload)
                state.secretList = [...state.groupedSecretList.passwordList, ...state.groupedSecretList.notesList, ...state.groupedSecretList.othersList, ...state.groupedSecretList.documentsList]
            })
            .addCase(addSecretThunk.rejected, (state, action) => {
                state.addState = 'failed';
                state.error = action.error.message;
            })
            .addCase(updateSecretThunk.pending, (state) => {
                state.addState = 'loading';
            })
            .addCase(updateSecretThunk.fulfilled, (state, action) => {
                state.addState = 'succeeded';
                state.showEditDialog = false;
                state.secretToAdd = {};
                state.groupedSecretList = updateSecretInGroupedSecretList(state.groupedSecretList, action.payload)
                state.secretList = [...state.groupedSecretList.passwordList, ...state.groupedSecretList.notesList, ...state.groupedSecretList.othersList, ...state.groupedSecretList.documentsList]
            })
            .addCase(updateSecretThunk.rejected, (state, action) => {
                state.addState = 'failed';
                state.error = action.error.message;
            })
            .addCase(deleteSecretThunk.pending, (state) => {
                state.addState = 'loading';
            })
            .addCase(deleteSecretThunk.fulfilled, (state, action) => {
                state.addState = 'succeeded';
                state.showDeleteDialog = false;
                state.groupedSecretList = removeSecretFromGroupedSecretList(state.groupedSecretList, action.payload)
                state.secretList = [...state.groupedSecretList.passwordList, ...state.groupedSecretList.notesList, ...state.groupedSecretList.othersList, ...state.groupedSecretList.documentsList]
            })
            .addCase(deleteSecretThunk.rejected, (state, action) => {
                state.addState = 'failed';
                state.error = action.error.message;
            });
    },
})

const updateSecretInGroupedSecretList = (group: GroupedSecretList, secret: Secret): GroupedSecretList => {
    const newGroupedSecretList = {
        ...group
    }
    const category = secret?.category && secret.category.length > 0 ? secret.category [0] as SecretCategory : undefined;
    if (category?.hasOwnProperty('Password')) {
        newGroupedSecretList.passwordList = newGroupedSecretList.passwordList.filter(s => s.id != secret.id);
        newGroupedSecretList.passwordList.push(mapSecretListEntry(secret, UiSecretCategory.Password))
    } else if (category?.hasOwnProperty('Note')) {
        newGroupedSecretList.notesList = newGroupedSecretList.notesList.filter(s => s.id != secret.id);
        newGroupedSecretList.notesList.push(mapSecretListEntry(secret, UiSecretCategory.Note));
    } else if (category?.hasOwnProperty('Document')) {
        newGroupedSecretList.documentsList = newGroupedSecretList.documentsList.filter(s => s.id != secret.id);
        newGroupedSecretList.documentsList.push(mapSecretListEntry(secret, UiSecretCategory.Document));
    } else {
        newGroupedSecretList.othersList = newGroupedSecretList.othersList.filter(s => s.id != secret.id);
        newGroupedSecretList.othersList.push(mapSecretListEntry(secret, undefined));
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

const addSecretToGroupedSecretList = (group: GroupedSecretList, secret: Secret): GroupedSecretList => {
    const newGroupedSecretList = {
        ...group
    }
    const category: SecretCategory = secret?.category && secret.category.length > 0 ? secret.category [0] as SecretCategory : undefined;
    if (category?.hasOwnProperty('Password')) {
        newGroupedSecretList.passwordList.push(mapSecretListEntry(secret, UiSecretCategory.Password))
    } else if (category?.hasOwnProperty('Note')) {
        newGroupedSecretList.notesList.push(mapSecretListEntry(secret, UiSecretCategory.Note));
    } else if (category?.hasOwnProperty('Document')) {
        newGroupedSecretList.documentsList.push(mapSecretListEntry(secret, UiSecretCategory.Document));
    } else {
        newGroupedSecretList.othersList.push(mapSecretListEntry(secret, undefined));
    }
    return newGroupedSecretList;
}

const mapSecretListEntry = (secretListEntry: SecretListEntry, category: UiSecretCategory): UiSecretListEntry => {
    return {
        id: secretListEntry.id,
        name: secretListEntry.name && secretListEntry.name.length > 0 ? secretListEntry.name[0] : undefined,
        category,
    }
}

const splitSecretListByCategory = (secretList: SecretListEntry[]): GroupedSecretList => {
    const passwordList: UiSecretListEntry[] = [];
    const notesList: UiSecretListEntry[] = [];
    const documentsList: UiSecretListEntry[] = [];
    const othersList: UiSecretListEntry[] = [];

    if (secretList) {
        secretList.forEach(secretListEntry => {
            secretListEntry.category.forEach(cat => {
                const category = cat as SecretCategory;
                if (category.hasOwnProperty('Password')) {
                    passwordList.push(mapSecretListEntry(secretListEntry, UiSecretCategory.Password))
                } else if (category.hasOwnProperty('Note')) {
                    notesList.push(mapSecretListEntry(secretListEntry, UiSecretCategory.Note));
                } else if (category.hasOwnProperty('Document')) {
                    documentsList.push(mapSecretListEntry(secretListEntry, UiSecretCategory.Document));
                } else {
                    othersList.push(mapSecretListEntry(secretListEntry, undefined));
                }
            })
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
