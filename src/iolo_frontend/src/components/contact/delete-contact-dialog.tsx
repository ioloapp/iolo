import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import {
    selectContactsDialogItem,
    selectContactsDialogItemState,
    selectContactsError,
    selectShowDeleteContactsDialog
} from "../../redux/contacts/contactsSelectors";
import {contactsActions, deleteContactThunk} from "../../redux/contacts/contactsSlice";
import {BasicDialog} from "../dialog/basic-dialog";
import {Trans, useTranslation} from "react-i18next";

export default function DeleteContactDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showDeleteContactDialog: boolean = useSelector(selectShowDeleteContactsDialog);
    const contactToAdd = useSelector(selectContactsDialogItem);
    const contactError = useSelector(selectContactsError);
    const contactToAddState = useSelector(selectContactsDialogItemState);

    const handleClose = () => {
        dispatch(contactsActions.closeDeleteDialog());
    };

    const cancelDeleteContact = () => {
        dispatch(contactsActions.cancelDeleteContact())
    }

    const deleteContact = async () => {
        dispatch(deleteContactThunk(contactToAdd));
    }

    return (
        <BasicDialog  title={t('contacts.dialog.delete.title')}
                      leadText={<Trans i18nKey='contacts.dialog.delete.text' values={{contact: contactToAdd.name}} />}
                      isOpen={showDeleteContactDialog}
                      handleClose={handleClose}
                      cancelAction={cancelDeleteContact}
                      okAction={deleteContact}
                      okButtonText={t('contacts.dialog.delete.button')}
                      error={contactError}
                      dialogItemState={contactToAddState}>
        </BasicDialog>
    );
}
