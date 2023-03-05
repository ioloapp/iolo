import * as React from 'react';
import { useEffect, useState } from 'react';

// Redux
import { useAppDispatch } from '../redux/hooks'; // for typescript

// MUI
import {
    Box, Typography, List, ListItem, IconButton, ListItemText, TextField, Button, Select, MenuItem, ListItemAvatar, Avatar, Modal, Fab
} from '@mui/material';
import { Edit as EditIcon, Key as KeyIcon, Add as AddIcon } from '@mui/icons-material';

// IC
import { getActor } from '../utils/backend';
import type { Secret } from '../../../declarations/iccrypt_backend/iccrypt_backend.did';

const secretCategories = {
    PASSWORD: "PASSWORD",
    NOTE: "NOTE",
    DOCUMENT: "DOCUMENT"
}
const secrets = [{
    id: "1",
    name: "my-first-secret",
    type: secretCategories.PASSWORD,
    username: "harry.hole@jim-beam.com",
    password: "dont-forget"
}, {
    id: "2",
    name: "my-second-secret",
    type: secretCategories.NOTE,
    username: "diego.armando.maradona@heaven.com",
    password: "dont-forget"
}];

const editSecretInitValues = {
    id: '',
    name: '',
    type: secretCategories.PASSWORD,
    username: '',
    password: ''
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
    const [editSecret, setEditSecret] = useState(editSecretInitValues);
    const [openModal, setOpenModal] = useState(false);

    function saveSecret() {
        console.log("Current Secret ID: ", editSecret.id);
        console.log("Current Secret Name: ", editSecret.name);
        console.log("Current Secret Type: ", editSecret.type);
        console.log("Current Secret Username: ", editSecret.username);
        console.log("Current Secret Password: ", editSecret.password);
        handleCloseModal();
    }

    const handleOpenModal = (secret) => {
        if (secret) {
            // Prefill values for existing secret
            setEditSecret({ id: secret.id, name: secret.name, type: secret.type, username: secret.username, password: secret.password });
        } else {
            // Initialize values for new secret
            setEditSecret(editSecretInitValues);
        }

        // Open Modal
        setOpenModal(true);
    }

    const handleCloseModal = () => setOpenModal(false);

    const handleEditSecretValueChange = (e) => {
        const { name, value } = e.target;
        setEditSecret({
            ...editSecret,
            [name]: value,
        });
    }

    async function getUserVault() {
        let actor = await getActor();
        let userVault = await actor.get_user_vault();
        console.log(userVault);
    }

    return (
        <Box >
            <Box>
                <Typography variant="h3" paragraph>
                    My Secrets
                </Typography>
            </Box>
            <List>
                {secrets.map(secret =>
                    <ListItem
                        key={secret.id}
                        secondaryAction={
                            <IconButton edge="end" aria-label="delete" onClick={() => handleOpenModal(secret)}>
                                <EditIcon />
                            </IconButton>
                        }
                    >
                        <ListItemAvatar>
                            <Avatar>
                                <KeyIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={secret.name}
                            secondary={secret.username}
                        />
                    </ListItem>
                )}
            </List>
            <Fab color="primary" aria-label="add" onClick={() => handleOpenModal(null)} sx={{ position: 'absolute', bottom: 16, right: 16 }}>
                <AddIcon />
            </Fab>
            <Modal
                open={openModal}
                onClose={handleCloseModal}
            >
                <Box sx={modalStyle}>
                        <Box>
                            <TextField required name="name" margin="normal" fullWidth size="small" label="Name" variant="filled" value={editSecret.name} onChange={handleEditSecretValueChange} />
                        </Box>
                        <Box>
                            <Select
                                required
                                name="type"
                                label="Type"
                                autoWidth
                                value={editSecret.type}
                                onChange={handleEditSecretValueChange}
                            >
                                <MenuItem value={secretCategories.PASSWORD}>Password</MenuItem>
                                <MenuItem value={secretCategories.NOTE}>Note</MenuItem>
                                <MenuItem value={secretCategories.DOCUMENT}>Document</MenuItem>
                            </Select>
                        </Box>

                        <Box>
                            <TextField required name="username" margin="normal" fullWidth size="small" label="Username" variant="filled" value={editSecret.username} onChange={handleEditSecretValueChange} />
                        </Box>

                        <Box>
                            <TextField required name="password" margin="normal" fullWidth size="small" label="Password" variant="filled" value={editSecret.password} onChange={handleEditSecretValueChange} />
                        </Box>
                        <Box>
                            <Button variant="contained" type="submit" onClick={() => saveSecret()}>Save</Button>
                        </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default SmartVault;