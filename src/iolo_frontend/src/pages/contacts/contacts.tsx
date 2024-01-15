import {Avatar, Box, IconButton, List, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import * as React from "react";
import {useEffect, useState} from "react";
import {PageLayout} from "../../components/layout/page-layout";
import {useAppDispatch} from "../../redux/hooks";
import {useSelector} from "react-redux";
import {selectContacts, selectContactsError, selectContactsListState} from "../../redux/contacts/contactsSelectors";
import {contactsActions, loadContactsThunk} from "../../redux/contacts/contactsSlice";
import AddContactDialog from "../../components/contact/add-contact-dialog";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import {UiUser, UiUserType} from "../../services/IoloTypesForUi";
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteContactDialog from "../../components/contact/delete-contact-dialog";
import EditContactDialog from "../../components/contact/edit-contact-dialog";
import {Error} from "../../components/error/error";
import {useLocation} from "react-router-dom";
import {useTranslation} from "react-i18next";

export function Contacts() {

    const dispatch = useAppDispatch();
    const heirs = useSelector(selectContacts);
    const heirListState = useSelector(selectContactsListState);
    const heirListError = useSelector(selectContactsError);
    const queryParams = new URLSearchParams(useLocation().search);
    const { t } = useTranslation();

    if (queryParams.get('action') === 'addHeirWithDeepLink' && queryParams.get('principalId') && queryParams.get('principalType')) {
        dispatch(contactsActions.updateContactToAdd({
            type: queryParams.get('principalType'),
            email: queryParams.get('email') ? queryParams.get('email') : '',
            name: queryParams.get('name') ? queryParams.get('name') : '',
            id: queryParams.get('principalId')
        }));
        dispatch(contactsActions.openAddDialog());
    }

    useEffect(() => {
        dispatch(loadContactsThunk())
    }, [])

    useEffect(() => {
        setFilteredHeirs(heirs)
    }, [heirs])


    const [filteredHeirs, setFilteredHeirs] = useState(heirs)
    const deleteHeir = (heir: UiUser) => {
        dispatch(contactsActions.updateContactToAdd(heir));
        dispatch(contactsActions.openDeleteDialog());
    }

    const editHeir = (heir: UiUser) => {
        dispatch(contactsActions.updateContactToAdd(heir));
        dispatch(contactsActions.openEditDialog());
    }

    const filterHeirsList = (search: string) => {
        const searchString = search.toLowerCase();
        if (searchString.length === 0) {
            setFilteredHeirs(heirs);
        } else {
            setFilteredHeirs(heirs.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0 || s.email.toLowerCase().indexOf(searchString) >= 0))
        }
    }

    const hasError = (): boolean => {
        return heirListState === 'failed';
    }

    return (
        <PageLayout title={t('contacts.title')} filterList={filterHeirsList}>
            <>
                <Box>
                    {hasError() &&
                        <Error error={heirListError}/>
                    }
                    {!hasError() && filteredHeirs &&
                        <Box>
                            <List dense={false}>
                                {filteredHeirs.map((heir: UiUser) =>
                                    <ListItem key={heir.id} secondaryAction={
                                        <>
                                            <IconButton edge="end" aria-label="delete" onClick={() => editHeir(heir)}>
                                                <EditOutlinedIcon/>
                                            </IconButton>
                                            <IconButton edge="end" aria-label="delete" onClick={() => deleteHeir(heir)}>
                                                <DeleteIcon/>
                                            </IconButton>
                                        </>
                                    }>
                                        {heir.type === UiUserType.Person &&
                                            <>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <PersonOutlinedIcon/>
                                                    </Avatar>
                                                </ListItemAvatar>

                                                <ListItemText
                                                    primary={`${heir.name}`}
                                                    secondary={heir.email}
                                                />
                                            </>
                                        }
                                        {heir.type === UiUserType.Company &&
                                            <>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <ApartmentOutlinedIcon/>
                                                    </Avatar>
                                                </ListItemAvatar>

                                                <ListItemText
                                                    primary={heir.name}
                                                    secondary={heir.email}
                                                />
                                            </>
                                        }
                                    </ListItem>,
                                )}
                            </List>
                        </Box>
                    }
                </Box>
                <AddContactDialog/>
                <EditContactDialog/>
                <DeleteContactDialog/>
            </>
        </PageLayout>
    )
}
