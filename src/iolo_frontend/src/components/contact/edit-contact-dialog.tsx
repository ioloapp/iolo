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
    const showEditHeirDialog = useSelector(selectShowEditContactsDialog);
    const heirToAdd = useSelector(selectContactsDialogItem);
    const heirToAddState = useSelector(selectContactsDialogItemState);
    const heirError = useSelector(selectContactsError);

    const handleClose = () => {
        dispatch(contactsActions.closeAddDialog());
    };

    const cancelEditContact = () => {
        dispatch(contactsActions.cancelEditContact())
    }

    const updateHeir = async () => {
        dispatch(updateContactThunk(heirToAdd));
    }

    return (
            <BasicDialog  title={t('contacts.dialog.edit.title')}
            leadText={t('contacts.dialog.edit.text')}
            isOpen={showEditHeirDialog}
            handleClose={handleClose}
            cancelAction={cancelEditContact}
            okAction={updateHeir}
            okButtonText={t('contacts.dialog.edit.button')}
            error={heirError}
            dialogItemState={heirToAddState}>
                <ContactDialogContent />
            </BasicDialog>
    );
}
