import {Avatar, Box, List, ListItem, ListItemAvatar, ListItemText, Typography} from "@mui/material";
import * as React from "react";
import {useEffect} from "react";
import {useAppDispatch} from "../../redux/hooks";
import {loadSecretsThunk} from "../../redux/secrets/secretsSlice";
import {PageLayout} from "../../components/layout/page-layout";
import PasswordIcon from '@mui/icons-material/Password';
import NotesIcon from '@mui/icons-material/Notes';
import DescriptionIcon from '@mui/icons-material/Description';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import {useSelector} from "react-redux";
import {selectSecrets} from "../../redux/secrets/secretsSelectors";
import AddSecretDialog from "../../components/secret/add-secret-dialog";

export function Wallet() {

    const dispatch = useAppDispatch();
    const secretList = useSelector(selectSecrets);

    useEffect(() => {
        dispatch(loadSecretsThunk())
    }, [])

    return (
        <PageLayout title="Wallet">
            <Box>
                {secretList &&
                    <>
                        {secretList.passwordList &&
                            <Box>
                                <Typography variant="h4">Passwords</Typography>
                                <List dense={false}>
                                    {secretList.passwordList.map(secret =>
                                        <ListItem key={secret.id}>
                                            <ListItemAvatar>
                                                <Avatar>
                                                    <PasswordIcon/>
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={secret.name}
                                            />
                                        </ListItem>,
                                    )}
                                </List>
                            </Box>
                        }
                        {secretList.notesList &&
                            <Box>
                                <Typography variant="h4">Notes</Typography>
                                <List dense={false}>
                                    {secretList.notesList.map(secret =>
                                        <ListItem key={secret.id}>
                                            <ListItemAvatar>
                                                <Avatar>
                                                    <NotesIcon/>
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={secret.name}
                                            />
                                        </ListItem>,
                                    )}
                                </List>
                            </Box>
                        }
                        {secretList.documentsList &&
                            <Box>
                                <Typography variant="h4">Documents</Typography>
                                <List dense={false}>
                                    {secretList.documentsList.map(secret =>
                                        <ListItem key={secret.id}>
                                            <ListItemAvatar>
                                                <Avatar>
                                                    <DescriptionIcon/>
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={secret.name}
                                            />
                                        </ListItem>,
                                    )}
                                </List>
                            </Box>
                        }
                        {secretList.othersList &&
                            <Box>
                                <Typography variant="h4">No Category</Typography>
                                <List dense={false}>
                                    {secretList.othersList.map(secret =>
                                        <ListItem key={secret.id}>
                                            <ListItemAvatar>
                                                <Avatar>
                                                    <QuestionMarkIcon/>
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={secret.name}
                                            />
                                        </ListItem>,
                                    )}
                                </List>
                            </Box>
                        }
                    </>
                }
            </Box>
            <AddSecretDialog/>
        </PageLayout>);
}
