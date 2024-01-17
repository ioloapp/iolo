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
    const showDeleteHeirDialog: boolean = useSelector(selectShowDeleteContactsDialog);
    const heirToAdd = useSelector(selectContactsDialogItem);
    const heirError = useSelector(selectContactsError);
    const heirToAddState = useSelector(selectContactsDialogItemState);

    const handleClose = () => {
        dispatch(contactsActions.closeDeleteDialog());
    };

    const cancelDeleteContact = () => {
        dispatch(contactsActions.cancelDeleteContact())
    }

    const deleteHeir = async () => {
        dispatch(deleteContactThunk(heirToAdd));
    }

    return (
        <BasicDialog  title={t('contacts.dialog.delete.title')}
                      leadText={<Trans i18nKey='contacts.dialog.delete.text' values={{contact: heirToAdd.name}} />}
                      isOpen={showDeleteHeirDialog}
                      handleClose={handleClose}
                      cancelAction={cancelDeleteContact}
                      okAction={deleteHeir}
                      okButtonText={t('contacts.dialog.delete.button')}
                      error={heirError}
                      dialogItemState={heirToAddState}>
        </BasicDialog>
    );
}
