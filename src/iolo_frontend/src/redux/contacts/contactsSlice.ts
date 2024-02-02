import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from "./contactsState";
import IoloService from "../../services/IoloService";
import {RootState} from "../store";
import {UiUser} from "../../services/IoloTypesForUi";
import {mapError} from "../../utils/errorMapper";

const ioloService = new IoloService();

export const addContactThunk = createAsyncThunk<UiUser, UiUser, {
    state: RootState }
>('contacts/add',
    async (contact, {rejectWithValue}) => {
        try {
            return await ioloService.addContact(contact);
        } catch (e) {
            return rejectWithValue(e)
        }
    }
);

export const updateContactThunk = createAsyncThunk<UiUser, UiUser, {
    state: RootState }
>('contacts/update',
    async (contact, {rejectWithValue}) => {
        try {
            return await ioloService.updateContact(contact);
        } catch (e) {
            return rejectWithValue(e)
        }
    }
);

export const deleteContactThunk = createAsyncThunk<string, UiUser, {
    state: RootState
}>('contacts/delete',
    async (contact, {rejectWithValue}) => {
        try {
            await ioloService.deleteContact(contact.id);
            return contact.id;
        } catch (e) {
            return rejectWithValue(e)
        }
    }
);

export const loadContactsThunk = createAsyncThunk<UiUser[], void, {
    state: RootState }
>('contacts/load',
    async (_, {rejectWithValue}) => {
        try {
            return await ioloService.getContactsList();
        } catch (e) {
            return rejectWithValue(e)
        }
    }
);

// Define a type for the slice state
export const contactsSlice = createSlice({
    name: 'contacts',
    initialState,
    reducers: {
        closeAddDialog: state => {
            state.showAddDialog = false
        },
        openAddDialog: state => {
            state.showAddDialog = true
            state.error = undefined;
        },
        cancelAddContact: state => {
            state.dialogItem = initialState.dialogItem;
            state.showAddDialog = false;
        },
        cancelEditContact: state => {
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
        cancelDeleteContact: state => {
            state.dialogItem = initialState.dialogItem;
            state.showDeleteDialog = false;
        },
        updateContactToAdd: (state, action: PayloadAction<UiUser>) => {
            state.dialogItem = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadContactsThunk.pending, (state) => {
                state.loadingState = 'pending';
                state.error = undefined;
            })
            .addCase(loadContactsThunk.fulfilled, (state, action) => {
                state.loadingState = 'succeeded';
                state.contactsList = action.payload
            })
            .addCase(loadContactsThunk.rejected, (state, action) => {
                state.loadingState = 'failed';
                state.error = action.error.message;
            })
            .addCase(addContactThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
                state.showAddDialog = true;
            })
            .addCase(addContactThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showAddDialog = false;
                state.dialogItem = initialState.dialogItem;
                if(action.payload) {
                    state.contactsList = [...(state.contactsList ? state.contactsList : []), action.payload]
                }
            })
            .addCase(addContactThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
                state.showAddDialog = true;
            })
            .addCase(updateContactThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
            })
            .addCase(updateContactThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showEditDialog = false;
                state.dialogItem = initialState.dialogItem;
                if(action.payload) {
                    state.contactsList = [...state.contactsList.filter(h => h.id != action.payload.id), action.payload]
                }
            })
            .addCase(updateContactThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            })
            .addCase(deleteContactThunk.pending, (state) => {
                state.dialogItemState = 'pending';
                state.error = undefined;
            })
            .addCase(deleteContactThunk.fulfilled, (state, action) => {
                state.dialogItemState = 'succeeded';
                state.showDeleteDialog = false;
                if(action.payload) {
                    state.contactsList = [...state.contactsList.filter(h => h.id != action.payload)]
                }
            })
            .addCase(deleteContactThunk.rejected, (state, action) => {
                state.dialogItemState = 'failed';
                state.error = action.error.message;
            });
    },
})

// Action creators are generated for each case reducer function
export const contactsActions = contactsSlice.actions;

export const contactsReducer = contactsSlice.reducer;
