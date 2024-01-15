import * as React from 'react';
import {useSelector} from "react-redux";
import {useAppDispatch} from "../../redux/hooks";
import AddIcon from "@mui/icons-material/Add";
import {Fab} from "@mui/material";
import {
    selectContactsDialogItem,
    selectContactsDialogItemState,
    selectContactsError,
    selectShowAddContactsDialog
} from "../../redux/contacts/contactsSelectors";
import {addContactThunk, contactsActions, updateContactThunk} from "../../redux/contacts/contactsSlice";
import {BasicDialog} from "../dialog/basic-dialog";
import ContactDialogContent from "./contact-dialog-content";
import {useTranslation} from "react-i18next";

export default function AddContactDialog() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const showAddHeirDialog = useSelector(selectShowAddContactsDialog);
    const dialogItem = useSelector(selectContactsDialogItem);
    const dialogItemState = useSelector(selectContactsDialogItemState);
    const heirError = useSelector(selectContactsError);

    const handleClickOpen = () => {
        dispatch(contactsActions.openAddDialog());
    };

    const handleClose = () => {
        dispatch(contactsActions.closeAddDialog());
    };

    const cancelAddContact = () => {
        dispatch(contactsActions.cancelAddContact())
    }

    const createHeir = async () => {
        dispatch(addContactThunk(dialogItem));
    }

    const updateHeir = async () => {
        dispatch(updateContactThunk(dialogItem));
    }

    return (
        <div>
            <Fab color="primary" aria-label={t('contacts.dialog.add.button')} onClick={handleClickOpen} sx={{
                position: "fixed",
                bottom: (theme) => theme.spacing(10),
                right: (theme) => theme.spacing(2)
            }}>
                <AddIcon/>
            </Fab>
            <BasicDialog  title={t('contacts.dialog.add.title')}
            leadText={t('contacts.dialog.add.text')}
            isOpen={showAddHeirDialog}
            handleClose={handleClose}
            cancelAction={cancelAddContact}
            okAction={createHeir}
            okButtonText={t('contacts.dialog.add.button')}
            error={heirError}
            dialogItemState={dialogItemState}>
                <ContactDialogContent />
            </BasicDialog>
        </div>
    );
}
