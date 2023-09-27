import {Avatar, Box, Button, List, ListItem, ListItemAvatar, ListItemText, Typography} from "@mui/material";
import * as React from "react";
import {useEffect} from "react";
import {useAppDispatch} from "../../redux/hooks";
import {addSecretThunk, loadSecretsThunk} from "../../redux/secrets/secretsSlice";
import {v4 as uuidv4} from 'uuid';
import {PageLayout} from "../../components/layout/page-layout";
import PasswordIcon from '@mui/icons-material/Password';
import NotesIcon from '@mui/icons-material/Notes';
import DescriptionIcon from '@mui/icons-material/Description';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import {useSelector} from "react-redux";
import {selectSecrets} from "../../redux/secrets/secretsSelectors";

export function Wallet() {

    const dispatch = useAppDispatch();
    const secretList = useSelector(selectSecrets);

    useEffect(() => {
        dispatch(loadSecretsThunk())
    }, [])


    const createSecret = async () => {
        dispatch(addSecretThunk({
            id: uuidv4(),
            category: undefined,
            date_created: 0n,
            date_modified: 0n,
            name: ['test'],
            notes: undefined,
            password: undefined,
            url: undefined,
            username: undefined

        }));
    }

    function generate(element: React.ReactElement) {
        return [0, 1, 2].map((value) =>
            React.cloneElement(element, {
                key: value,
            }),
        );
    }

    return (
        <PageLayout title="Wallet">
            <Box>
                {secretList.passwordList && <Box>
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
                <Box>
                    <Button variant="contained" onClick={createSecret}>Create Secret</Button>
                </Box>
            </Box>
        </PageLayout>);
}
