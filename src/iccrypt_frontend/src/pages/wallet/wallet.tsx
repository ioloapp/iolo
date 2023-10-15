import {Box, List, Typography} from "@mui/material";
import * as React from "react";
import {useEffect} from "react";
import {useAppDispatch} from "../../redux/hooks";
import {loadSecretsThunk, secretsActions} from "../../redux/secrets/secretsSlice";
import {PageLayout} from "../../components/layout/page-layout";
import PasswordIcon from '@mui/icons-material/Password';
import NotesIcon from '@mui/icons-material/Notes';
import DescriptionIcon from '@mui/icons-material/Description';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import {useSelector} from "react-redux";
import {selectGroupedSecrets} from "../../redux/secrets/secretsSelectors";
import AddEditSecretDialog from "../../components/secret/add-edit-secret-dialog";
import {UiSecretListEntry} from "../../services/IcTypesForUi";
import {SecretItem} from "./secret-item";
import DeleteSecretDialog from "../../components/secret/delete-secret-dialog";

export function Wallet() {

    const dispatch = useAppDispatch();
    const groupedSecretList = useSelector(selectGroupedSecrets);

    useEffect(() => {
        dispatch(loadSecretsThunk())
    }, [])

    const deleteItem = (secret: UiSecretListEntry) => {
        dispatch(secretsActions.updateSecretToAdd(secret));
        dispatch(secretsActions.openDeleteDialog());
    }

    const editItem = (secret: UiSecretListEntry) => {
        dispatch(secretsActions.updateSecretToAdd(secret));
        dispatch(secretsActions.openEditDialog());
    }

    return (
        <PageLayout title="Wallet">
            <Box sx={{width: '100%'}}>
                {groupedSecretList &&
                    <>
                        {groupedSecretList.passwordList &&
                            <Box>
                                <Typography variant="h5">Passwords</Typography>
                                <List dense={false}>
                                    {groupedSecretList.passwordList.map((secret: UiSecretListEntry) =>
                                        <SecretItem secret={secret} editAction={editItem} deleteAction={deleteItem}><PasswordIcon/></SecretItem>
                                    )}
                                </List>
                            </Box>
                        }
                        {groupedSecretList.notesList &&
                            <Box>
                                <Typography variant="h5">Notes</Typography>
                                <List dense={false}>
                                    {groupedSecretList.notesList.map((secret: UiSecretListEntry) =>
                                        <SecretItem secret={secret} editAction={editItem} deleteAction={deleteItem}><NotesIcon/></SecretItem>
                                    )}
                                </List>
                            </Box>
                        }
                        {groupedSecretList.documentsList &&
                            <Box>
                                <Typography variant="h5">Documents</Typography>
                                <List dense={false}>
                                    {groupedSecretList.documentsList.map((secret: UiSecretListEntry) =>
                                        <SecretItem secret={secret} editAction={editItem} deleteAction={deleteItem}><DescriptionIcon/></SecretItem>
                                    )}
                                </List>
                            </Box>
                        }
                        {groupedSecretList.othersList &&
                            <Box>
                                <Typography variant="h5">No Category</Typography>
                                <List dense={false}>
                                    {groupedSecretList.othersList.map((secret: UiSecretListEntry) =>
                                        <SecretItem secret={secret} editAction={editItem} deleteAction={deleteItem}><QuestionMarkIcon/></SecretItem>
                                    )}
                                </List>
                            </Box>
                        }
                    </>
                }
            </Box>
            <AddEditSecretDialog/>
            <DeleteSecretDialog/>
        </PageLayout>);
}
