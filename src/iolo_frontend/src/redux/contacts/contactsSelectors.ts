import {RootState} from "../store";

export const selectContacts = (state: RootState)  => state.contacts.contactsList;

export const selectContactListState = (state: RootState)  => state.contacts.loadingState;

export const selectShowAddContactsDialog = (state: RootState)  => state.contacts.showAddDialog;

export const selectShowEditContactsDialog = (state: RootState)  => state.contacts.showEditDialog;

export const selectShowDeleteContactsDialog = (state: RootState)  => state.contacts.showDeleteDialog;

export const selectContactsDialogItem = (state: RootState)  => state.contacts.dialogItem;

export const selectContactsError = (state: RootState)  => state.contacts.error;

export const selectContactsDialogItemState = (state: RootState)  => state.contacts.dialogItemState;
