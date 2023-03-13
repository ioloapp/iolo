import * as React from 'react';
import { useEffect, useState } from 'react';

// MUI
import {
    Box, Typography, List, ListItem, IconButton, ListItemText, TextField, Button, Select, MenuItem, ListItemAvatar, Avatar, Modal, Fab, ListItemButton, Backdrop, CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Key as KeyIcon, Add as AddIcon } from '@mui/icons-material';

// IC
import { getActor } from '../utils/backend';
import { SecretCategory, SecretForCreation, SecretForUpdate, Result_2, Result_3, Result, Secret } from '../../../declarations/iccrypt_backend/iccrypt_backend.did';

const secretCategories = {
    Password: "Password",
    Note: "Note",
    Document: "Document"
}

const secretInModalInitValues = {
    id: 0,
    name: '',
    category: secretCategories.Password,
    username: '',
    password: '',
    url: '',
    notes: '',
}

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "70%",
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

const SmartVault = () => {

    useEffect(() => {
        getUserVault();
    }, []);

    // State hooks
    const [secretList, setSecretList] = useState([]);
    const [secretInModal, setSecretInModal] = useState(secretInModalInitValues);
    const [openModal, setOpenModal] = useState(false);
    const [loadingIconForSaveIsOpen, setLoadingIconForSave] = React.useState(false);
    const [loadingIconForDeleteIsOpen, setLoadingIconForDelete] = React.useState(false);

    async function saveSecret() {
        let secretCategory: SecretCategory = null;
        if (secretInModal.category === secretCategories.Password) {
            secretCategory = { 'Password': null };
        } else if (secretInModal.category === secretCategories.Note) {
            secretCategory = { 'Note': null };
        } else if (secretInModal.category === secretCategories.Document) {
            secretCategory = { 'Document': null };
        }

        setLoadingIconForSave(true);
        let actor = await getActor();
        if (secretInModal.id > 0) {
            // Update
            let secret: SecretForUpdate = {
                id: BigInt(secretInModal.id),
                name: [],
                url: [],
                category: [secretCategory],
                username: [],
                password: [],
                notes: []
            };
            if (secretInModal.name !== '') {
                secret.name = [secretInModal.name];
            }
            if (secretInModal.username !== '') {
                secret.username = [secretInModal.username];
            }
            if (secretInModal.password !== '') {
                secret.password = [secretInModal.password];
            }
            if (secretInModal.url !== '') {
                secret.url = [secretInModal.url];
            }
            if (secretInModal.notes !== '') {
                secret.notes = [secretInModal.notes];
            }
            let res: Result = await actor.update_user_secret(secret);
            if (Object.keys(res)[0] === 'Ok') {
                const secretsForList = secretList.map((secret, i) => {
                    if (secret.id === secretInModal.id) {
                        return secretInModal;
                    } else {
                        return secret;
                    }
                });
                setSecretList(secretsForList);
            } else {
                console.error(res);
            }
        } else {
            // Create
            let secret: SecretForCreation = {
                name: secretInModal.name,
                category: secretCategory,
                username: [],
                password: [],
                url: [],
                notes: []
            };
            if (secretInModal.username !== '') {
                secret.username = [secretInModal.username];
            }
            if (secretInModal.password !== '') {
                secret.password = [secretInModal.password];
            }
            if (secretInModal.url !== '') {
                secret.url = [secretInModal.url];
            }
            if (secretInModal.notes !== '') {
                secret.notes = [secretInModal.notes];
            }
            let res: Result = await actor.add_user_secret(secret);
            if (Object.keys(res)[0] === 'Ok') {
                setSecretList([
                    ...secretList,
                    { id: res['Ok']['id'], name: secretInModal.name, category: secretInModal.category, username: secretInModal.username, password: secretInModal.password, url: secretInModal.url, notes: secretInModal.notes }
                ]);
            } else {
                console.error(res);
            }
        }
        setLoadingIconForSave(false);
        handleCloseModal();
    }

    async function removeSecret(secretId: number) {
        setLoadingIconForDelete(true);
        let actor = await getActor();
        let res: Result_2 = await actor.remove_user_secret(BigInt(secretId));
        setLoadingIconForDelete(false);
        if (Object.keys(res)[0] === 'Ok') {
            setSecretList(
                secretList.filter(s =>
                    s.id !== secretId
                )
            );
        } else {
            console.error(res);
        }
    }

    const handleOpenModal = (selectedSecret) => {
        if (selectedSecret) {
            // Prefill values with existing secret
            setSecretInModal({ id: selectedSecret.id, name: selectedSecret.name, category: selectedSecret.category, username: selectedSecret.username, password: selectedSecret.password, url: selectedSecret.url, notes: selectedSecret.notes });
        } else {
            // Initialize values for new secret
            setSecretInModal(secretInModalInitValues);
        }

        // Open Modal
        setOpenModal(true);
    }

    const handleCloseModal = () => setOpenModal(false);

    const handleEditSecretValueChange = (e) => {
        const { name, value } = e.target;
        setSecretInModal({
            ...secretInModal,
            [name]: value,
        });
    }

    async function getUserVault() {
        let actor = await getActor();
        let userVault: Result_3 = await actor.get_user_vault();
        if (Object.keys(userVault)[0] === 'Ok') {
            let secrets: [Secret] = userVault['Ok']['secrets'];
            let secretsForList = secrets.map((secret) => {
                let mappedSecret = {
                    id: secret[1].id,
                    name: secret[1].name,
                    category: Object.keys(secret[1].category)[0],
                    username: secret[1].username[0],
                    password: secret[1].password[0],
                    notes: secret[1].notes[0],
                    url: secret[1].url[0],
                }

                return mappedSecret;
            });
            setSecretList(secretsForList);
        } else {
            console.error(userVault['Err']);
        }
    }

    return (
        <Box >
            <Box>
                <Typography variant="h3" paragraph>
                    My Secrets
                </Typography>
            </Box>
            <List>
                {secretList.map(secret =>
                    <ListItem
                        key={secret.id}
                        disablePadding
                        secondaryAction={
                            <IconButton edge="end" onClick={() => removeSecret(secret.id)}>
                                <DeleteIcon />
                            </IconButton>
                        }
                    ><ListItemButton onClick={() => handleOpenModal(secret)}>
                            <ListItemAvatar>
                                <Avatar>
                                    <KeyIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={secret.name}
                                secondary={secret.username}
                            />
                        </ListItemButton>

                    </ListItem>
                )}
            </List>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loadingIconForDeleteIsOpen}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <Fab color="primary" aria-label="add" onClick={() => handleOpenModal(null)} sx={{ position: 'absolute', bottom: 16, right: 16 }}>
                <AddIcon />
            </Fab>
            <Modal
                open={openModal}
                onClose={handleCloseModal}
            >
                <Box sx={modalStyle}>
                    <Box>
                        <TextField required name="name" margin="normal" fullWidth size="small" label="Name" variant="filled" value={secretInModal.name} onChange={handleEditSecretValueChange} />
                    </Box>
                    <Box>
                        <Select
                            required
                            name="category"
                            label="Category"
                            autoWidth
                            value={secretInModal.category}
                            onChange={handleEditSecretValueChange}
                        >
                            <MenuItem value={secretCategories.Password}>Password</MenuItem>
                            <MenuItem value={secretCategories.Note}>Note</MenuItem>
                            <MenuItem value={secretCategories.Document}>Document</MenuItem>
                        </Select>
                    </Box>

                    <Box>
                        <TextField required name="username" margin="normal" fullWidth size="small" label="Username" variant="filled" value={secretInModal.username} onChange={handleEditSecretValueChange} />
                    </Box>

                    <Box>
                        <TextField required name="password" margin="normal" fullWidth size="small" label="Password" variant="filled" value={secretInModal.password} onChange={handleEditSecretValueChange} />
                    </Box>
                    <Box>
                        <TextField required name="url" margin="normal" fullWidth size="small" label="Url" variant="filled" value={secretInModal.url} onChange={handleEditSecretValueChange} />
                    </Box>
                    <Box>
                        <TextField required name="notes" margin="normal" fullWidth size="small" label="Notes" variant="filled" value={secretInModal.notes} onChange={handleEditSecretValueChange} />
                    </Box>
                    <Box>
                        <Button variant="contained" type="submit" onClick={() => saveSecret()}>Save</Button>
                    </Box>
                    <Backdrop
                        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                        open={loadingIconForSaveIsOpen}
                    >
                        <CircularProgress color="inherit" />
                    </Backdrop>
                </Box>
            </Modal>
        </Box>
    );
};

export default SmartVault;