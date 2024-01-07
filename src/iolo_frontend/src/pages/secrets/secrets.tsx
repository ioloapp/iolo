import {Box, List, Typography} from "@mui/material";
import * as React from "react";
import {useEffect, useState} from "react";
import {useAppDispatch} from "../../redux/hooks";
import {
    getSecretInViewModeThunk,
    getSecretThunk,
    loadSecretsThunk,
    secretsActions
} from "../../redux/secrets/secretsSlice";
import {PageLayout} from "../../components/layout/page-layout";
import PasswordIcon from '@mui/icons-material/Password';
import NotesIcon from '@mui/icons-material/Notes';
import DescriptionIcon from '@mui/icons-material/Description';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import {useSelector} from "react-redux";
import {selectGroupedSecrets, selectSecretsError, selectSecretsListState} from "../../redux/secrets/secretsSelectors";
import AddSecretDialog from "../../components/secret/add-secret-dialog";
import {UiSecretListEntry} from "../../services/IoloTypesForUi";
import {SecretItem} from "./secret-item";
import DeleteSecretDialog from "../../components/secret/delete-secret-dialog";
import EditSecretDialog from "../../components/secret/edit-secret-dialog";
import {Error} from "../../components/error/error";
import {SelectListItem} from "../../components/selectlist/select-list";
import ViewSecretDialog from "../../components/secret/view-secret-dialog";

export function Secrets() {

    const dispatch = useAppDispatch();
    const groupedSecretList = useSelector(selectGroupedSecrets);
    const secretsListState = useSelector(selectSecretsListState);
    const secretsListError = useSelector(selectSecretsError);

    const [filteredSecretList, setFilteredSecretList] = useState(groupedSecretList)

    useEffect(() => {
        dispatch(loadSecretsThunk())
    }, [])

    useEffect(() => {
        setFilteredSecretList(groupedSecretList)
    }, [groupedSecretList])

    const deleteItem = (secret: UiSecretListEntry) => {
        dispatch(secretsActions.updateDialogItem(secret));
        dispatch(secretsActions.openDeleteDialog());
    }

    const editItem = (secret: UiSecretListEntry) => {
        dispatch(getSecretThunk(secret.id));
    }

    const viewItem = (value: SelectListItem) => {
        dispatch(getSecretInViewModeThunk({secretId: value.id}))
    }

    const filterSecretList = (search: string) => {
        const searchString = search.toLowerCase();
        if (searchString.length === 0) {
            setFilteredSecretList(groupedSecretList);
        } else {
            setFilteredSecretList({
                passwordList: groupedSecretList.passwordList.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0),
                documentsList: groupedSecretList.documentsList.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0),
                notesList: groupedSecretList.notesList.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0),
                othersList: groupedSecretList.othersList.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0),
            })
        }
    }

    const hasError = (): boolean => {
        return secretsListState === 'failed';
    }

    return (
        <PageLayout title="Wallet" filterList={filterSecretList}>
            <>
                <Box sx={{width: '100%'}}>
                    {hasError() &&
                        <Error error={secretsListError}/>
                    }
                    {!hasError() && filteredSecretList &&
                        <>
                            {filteredSecretList.passwordList?.length > 0 &&
                                <Box>
                                    <Typography variant="h5">Passwords</Typography>
                                    <List dense={false}>
                                        {filteredSecretList.passwordList.map((secret: UiSecretListEntry) =>
                                            <SecretItem key={secret.id} secret={secret} editAction={editItem}
                                                        viewAction={viewItem}
                                                        deleteAction={deleteItem}><PasswordIcon/></SecretItem>
                                        )}
                                    </List>
                                </Box>
                            }
                            {filteredSecretList.notesList?.length > 0 &&
                                <Box>
                                    <Typography variant="h5">Notes</Typography>
                                    <List dense={false}>
                                        {filteredSecretList.notesList.map((secret: UiSecretListEntry) =>
                                            <SecretItem key={secret.id} secret={secret} editAction={editItem}
                                                        viewAction={viewItem}
                                                        deleteAction={deleteItem}><NotesIcon/></SecretItem>
                                        )}
                                    </List>
                                </Box>
                            }
                            {filteredSecretList.documentsList?.length > 0 &&
                                <Box>
                                    <Typography variant="h5">Documents</Typography>
                                    <List dense={false}>
                                        {filteredSecretList.documentsList.map((secret: UiSecretListEntry) =>
                                            <SecretItem key={secret.id} secret={secret} editAction={editItem}
                                                        viewAction={viewItem}
                                                        deleteAction={deleteItem}><DescriptionIcon/></SecretItem>
                                        )}
                                    </List>
                                </Box>
                            }
                            {filteredSecretList.othersList?.length > 0 &&
                                <Box>
                                    <Typography variant="h5">No Category</Typography>
                                    <List dense={false}>
                                        {filteredSecretList.othersList.map((secret: UiSecretListEntry) =>
                                            <SecretItem key={secret.id} secret={secret} editAction={editItem}
                                                        viewAction={viewItem}
                                                        deleteAction={deleteItem}><QuestionMarkIcon/></SecretItem>
                                        )}
                                    </List>
                                </Box>
                            }
                        </>
                    }
                </Box>
                <ViewSecretDialog/>
                <AddSecretDialog/>
                <EditSecretDialog/>
                <DeleteSecretDialog/>
            </>
        </PageLayout>);
}
