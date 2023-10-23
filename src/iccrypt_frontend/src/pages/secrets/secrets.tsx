import {Box, IconButton, List, Typography} from "@mui/material";
import * as React from "react";
import {useEffect, useState} from "react";
import {useAppDispatch} from "../../redux/hooks";
import {getSecretThunk, loadSecretsThunk, secretsActions} from "../../redux/secrets/secretsSlice";
import {PageLayout} from "../../components/layout/page-layout";
import PasswordIcon from '@mui/icons-material/Password';
import NotesIcon from '@mui/icons-material/Notes';
import DescriptionIcon from '@mui/icons-material/Description';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import {useSelector} from "react-redux";
import {selectGroupedSecrets} from "../../redux/secrets/secretsSelectors";
import AddSecretDialog from "../../components/secret/add-secret-dialog";
import {UiSecretListEntry} from "../../services/IcTypesForUi";
import {SecretItem} from "./secret-item";
import DeleteSecretDialog from "../../components/secret/delete-secret-dialog";
import SearchIcon from "@mui/icons-material/Search";
import {SearchField, StyledAppBar} from "../../components/layout/search-bar";
import EditSecretDialog from "../../components/secret/edit-secret-dialog";

export function Secrets() {

    const dispatch = useAppDispatch();
    const groupedSecretList = useSelector(selectGroupedSecrets);

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

    const filterSecretList = (search: string) => {
        const searchString = search.toLowerCase();
        if(searchString.length === 0){
            setFilteredSecretList(groupedSecretList);
        }else {
            setFilteredSecretList({
                passwordList: groupedSecretList.passwordList.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0),
                documentsList: groupedSecretList.documentsList.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0),
                notesList: groupedSecretList.notesList.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0),
                othersList: groupedSecretList.othersList.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0),
            })
        }
    }

    return (
        <PageLayout title="Wallet">
            <StyledAppBar position="sticky">
                <SearchField id="outlined-basic" sx={{boxShadow: 'none'}} onChange={(e) => filterSecretList(e.target.value)}/>
                <IconButton size="large" aria-label="search" color="inherit">
                    <SearchIcon/>
                </IconButton>
            </StyledAppBar>
            <Box sx={{width: '100%'}}>
                {filteredSecretList &&
                    <>
                        {filteredSecretList.passwordList?.length > 0 &&
                            <Box>
                                <Typography variant="h5">Passwords</Typography>
                                <List dense={false}>
                                    {filteredSecretList.passwordList.map((secret: UiSecretListEntry) =>
                                        <SecretItem key={secret.id} secret={secret} editAction={editItem} deleteAction={deleteItem}><PasswordIcon/></SecretItem>
                                    )}
                                </List>
                            </Box>
                        }
                        {filteredSecretList.notesList?.length > 0 &&
                            <Box>
                                <Typography variant="h5">Notes</Typography>
                                <List dense={false}>
                                    {filteredSecretList.notesList.map((secret: UiSecretListEntry) =>
                                        <SecretItem key={secret.id} secret={secret} editAction={editItem} deleteAction={deleteItem}><NotesIcon/></SecretItem>
                                    )}
                                </List>
                            </Box>
                        }
                        {filteredSecretList.documentsList?.length > 0 &&
                            <Box>
                                <Typography variant="h5">Documents</Typography>
                                <List dense={false}>
                                    {filteredSecretList.documentsList.map((secret: UiSecretListEntry) =>
                                        <SecretItem key={secret.id} secret={secret} editAction={editItem} deleteAction={deleteItem}><DescriptionIcon/></SecretItem>
                                    )}
                                </List>
                            </Box>
                        }
                        {filteredSecretList.othersList?.length > 0 &&
                            <Box>
                                <Typography variant="h5">No Category</Typography>
                                <List dense={false}>
                                    {filteredSecretList.othersList.map((secret: UiSecretListEntry) =>
                                        <SecretItem key={secret.id} secret={secret} editAction={editItem} deleteAction={deleteItem}><QuestionMarkIcon/></SecretItem>
                                    )}
                                </List>
                            </Box>
                        }
                    </>
                }
            </Box>
            <AddSecretDialog/>
            <EditSecretDialog />
            <DeleteSecretDialog/>
        </PageLayout>);
}
