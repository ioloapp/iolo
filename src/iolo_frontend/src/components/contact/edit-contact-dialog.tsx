import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {
    selectContactsDialogItem,
    selectContactsDialogItemState,
    selectContactsError,
    selectShowEditContactsDialog
} from "../../redux/contacts/contactsSelectors";
import {contactsActions, updateContactThunk} from "../../redux/contacts/contactsSlice";
import {BasicDialog} from "../dialog/basic-dialog";
import ContactDialogContent from "./contact-dialog-content";
import {useTranslation} from "react-i18next";

export default function EditContactDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showEditContactDialog = useSelector(selectShowEditContactsDialog);
    const contactToAdd = useSelector(selectContactsDialogItem);
    const contactToAddState = useSelector(selectContactsDialogItemState);
    const contactError = useSelector(selectContactsError);

    const handleClose = () => {
        dispatch(contactsActions.closeAddDialog());
    };

    const cancelEditContact = () => {
        dispatch(contactsActions.cancelEditContact())
    }

    const updateContact = async () => {
        dispatch(updateContactThunk(contactToAdd));
    }

    return (
            <BasicDialog  title={t('contacts.dialog.edit.title')}
            leadText={t('contacts.dialog.edit.text')}
            isOpen={showEditContactDialog}
            handleClose={handleClose}
            cancelAction={cancelEditContact}
            okAction={updateContact}
            okButtonText={t('contacts.dialog.edit.button')}
            error={contactError}
            dialogItemState={contactToAddState}>
                <ContactDialogContent />
            </BasicDialog>
    );
}
