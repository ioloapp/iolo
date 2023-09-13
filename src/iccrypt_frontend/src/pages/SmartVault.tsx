// /*import * as React from 'react';
// import { useEffect, useState } from 'react';
//
// // Redux
// import { useAppSelector } from '../redux/hooks'; // for typescript
//
// // MUI
// import {
//     Box, Typography, List, ListItem, IconButton, ListItemText, TextField, Button, Select, MenuItem, ListItemAvatar, Avatar, Modal, Fab, ListItemButton, Backdrop, CircularProgress, InputAdornment, FilledInput, InputLabel, FormControl
// } from '@mui/material';
// import { Delete as DeleteIcon, Key as KeyIcon, Add as AddIcon, Visibility, VisibilityOff } from '@mui/icons-material';
//
// // IC
// import {
//     SecretCategory,
//     CreateSecretArgs,
//     SecretForUpdate,
//     Result_2,
//     Result_3,
//     Result,
//     Secret,
//     _SERVICE
// } from '../../../declarations/iccrypt_backend/iccrypt_backend.did';
//
// // Various
// import {
//     importRsaPublicKey,
//     importRsaPrivateKey,
//     decrypt,
//     encrypt,
//     ab2base64,
//     base642ab,
//     get_aes_256_gcm_key, aes_gcm_decrypt, aes_gcm_encrypt
// } from '../utils/crypto';
// import * as vetkd from "ic-vetkd-utils";
// import { iccrypt_backend } from "../../../declarations/iccrypt_backend";
// import * as agent from "@dfinity/agent";
// import IcCryptService from "../services/IcCryptService";
// import {ActorSubclass} from "@dfinity/agent";
//
// const secretCategories = {
//     Password: "Password",
//     Note: "Note",
//     Document: "Document"
// }
//
// const secretInModalInitValues = {
//     id: 0,
//     name: '',
//     category: secretCategories.Password,
//     username: '',
//     password: '',
//     url: '',
//     notes: '',
// }
//
// const modalStyle = {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: 'translate(-50%, -50%)',
//     width: "70%",
//     bgcolor: 'background.paper',
//     boxShadow: 24,
//     p: 4,
// };
//
//
// // Helper methods for Dfinity mock
// export const icCryptService = new IcCryptService();*/

const SmartVault = () => {

    /*useEffect(() => {
        getUserVault();
    }, []);

    const principal = useAppSelector((state) => state.user.principal);  // Principal from redux store

    // State hooks
    const [secretList, setSecretList] = useState([]);
    const [secretInModal, setSecretInModal] = useState(secretInModalInitValues);
    const [openModal, setOpenModal] = useState(false);
    const [loadingIconForModalIsOpen, setLoadingIconForModal] = React.useState(false);
    const [loadingIconForPageIsOpen, setLoadingIconForPage] = React.useState(false);
    const [showPassword, setShowPassword] = useState(false);
    //const [publicKey, setPublicKey] = useState(null);
    //const [privateKey, setPrivateKey] = useState(null);
    const [symmetricKey, setSymmetricKey] = useState(null);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    async function saveSecret() {

        // Process data
        let secretCategory: SecretCategory = null;
        if (secretInModal.category === secretCategories.Password) {
            secretCategory = { 'Password': null };
        } else if (secretInModal.category === secretCategories.Note) {
            secretCategory = { 'Note': null };
        } else if (secretInModal.category === secretCategories.Document) {
            secretCategory = { 'Document': null };
        }

        setLoadingIconForModal(true);
        let actor: ActorSubclass<_SERVICE> = icCryptService.getActor();
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
                let encryptedPassword = await aes_gcm_encrypt(secretInModal.password, symmetricKey);
                //let encryptedBuffer = await encrypt(publicKey, secretInModal.password);
                //let encryptedBase64 = ab2base64(encryptedBuffer);
                secret.password = [encryptedPassword];
            }
            if (secretInModal.url !== '') {
                secret.url = [secretInModal.url];
            }
            if (secretInModal.notes !== '') {
                let encryptedNotes = await aes_gcm_encrypt(secretInModal.notes, symmetricKey);
                //let encryptedBuffer = await encrypt(publicKey, secretInModal.notes);
                //let encryptedBase64 = ab2base64(encryptedBuffer);
                secret.notes = [encryptedNotes];
            }
            let res: Result = await actor.update_user_secret(secret);
            if (Object.keys(res)[0] === 'Ok') {
                const secretsForList = secretList.map((secret) => {
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
            let secret: CreateSecretArgs = {
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
                let encryptedPassword = await aes_gcm_encrypt(secretInModal.password, symmetricKey);
                //let encryptedBuffer = await encrypt(publicKey, secretInModal.password);
                //let encryptedBase64 = ab2base64(encryptedBuffer);
                secret.password = [encryptedPassword];
            }
            if (secretInModal.url !== '') {
                secret.url = [secretInModal.url];
            }
            if (secretInModal.notes !== '') {
                let encryptedNotes = await aes_gcm_encrypt(secretInModal.notes, symmetricKey);
                //let encryptedBuffer = await encrypt(publicKey, secretInModal.notes);
                //let encryptedBase64 = ab2base64(encryptedBuffer);
                secret.notes = [encryptedNotes];
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
        setLoadingIconForModal(false);
        handleCloseModal();
    }

    async function removeSecret(secretId: number) {
        setLoadingIconForPage(true);
        let actor = await getActor();
        let res: Result_2 = await actor.remove_user_secret(BigInt(secretId));
        setLoadingIconForPage(false);
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

    function toggleEncryption() {
        // not implemented yet
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
        setLoadingIconForPage(true);
        let actor = await getActor();
        const aes_256_key = await get_aes_256_gcm_key();
        setSymmetricKey(aes_256_key);
        //let res = await actor.get_encryption_key_pem_for(principal.toString()); // Set own principal as "heir" for encryption of the own vault
        //let pubKey = await importRsaPublicKey(res[0]);
        //setPublicKey(pubKey);

        //res = await actor.get_decryption_key_pem_from(principal.toString()); // Set own principal as "heir" for encryption of the own vault
        //let privKey = await importRsaPrivateKey(res[0]);
        //setPrivateKey(privKey);

        let userVault: Result_3 = await actor.get_user_vault();
        if (Object.keys(userVault)[0] === 'Ok') {
            let secrets: [Secret] = userVault['Ok']['secrets'];
            let secretsForList = await Promise.all(secrets.map(async (secret) => {
                // Decrypt password and notes
                let tempPassword: string | null;
                if (secret[1].password[0]) {
                    tempPassword = await aes_gcm_decrypt(secret[1].password[0], aes_256_key); // Use aes_256_key instead of state variable symmetricKey because the state variables seems not to be available here already...
                    //let tempPasswordBuffer = base642ab(secret[1].password[0]);
                    //tempPassword = await decrypt(privKey, tempPasswordBuffer); // Use privKey instead of state variable privateKey because the state variables seems not to be available here already...
                } else {
                    tempPassword = secret[1].password[0];
                }
                let tempNotes;
                if (secret[1].notes[0]) {
                    tempNotes = await aes_gcm_decrypt(secret[1].notes[0], aes_256_key); // Use aes_256_key instead of state variable symmetricKey because the state variables seems not to be available here already...
                    //let tempNotesBuffer = base642ab(secret[1].notes[0]);
                    //tempNotes = await decrypt(privKey, tempNotesBuffer); // Use privKey instead of state variable privateKey because the state variables seems not to be available here already...
                } else {
                    tempNotes = secret[1].notes[0];
                }
                let mappedSecret = {
                    id: secret[1].id,
                    name: secret[1].name,
                    category: Object.keys(secret[1].category)[0],
                    username: secret[1].username[0],
                    password: tempPassword,
                    notes: tempNotes,
                    url: secret[1].url[0],
                }
                return mappedSecret;
            }));
            setSecretList(secretsForList);
        } else {
            console.error(userVault['Err']);
        }
        setLoadingIconForPage(false);
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
                open={loadingIconForPageIsOpen}
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
                    <TextField required name="name" margin="normal" fullWidth size="small" label="Name" variant="filled" value={secretInModal.name} onChange={handleEditSecretValueChange} />
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
                        <TextField name="username" margin="normal" fullWidth size="small" label="Username" variant="filled" value={secretInModal.username} onChange={handleEditSecretValueChange} />
                    </Box>
                    <FormControl fullWidth size='small' variant="filled" margin='normal'>
                        <InputLabel>Password</InputLabel>
                        <FilledInput
                            name='password'
                            value={secretInModal.password}
                            onChange={handleEditSecretValueChange}
                            type={showPassword ? 'text' : 'password'}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        edge="end"
                                        onClick={handleClickShowPassword}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            }
                        />
                    </FormControl>
                    <Box>
                        <TextField name="url" margin="normal" fullWidth size="small" label="Url" variant="filled" value={secretInModal.url} onChange={handleEditSecretValueChange} />
                    </Box>
                    <Box>
                        <TextField name="notes" margin="normal" fullWidth size="small" label="Notes" variant="filled" value={secretInModal.notes} onChange={handleEditSecretValueChange} />
                    </Box>
                    <Box>
                        <Button variant="contained" onClick={saveSecret}>Save</Button>
                        <Button disabled sx={{ m: 2 }} variant="contained" onClick={toggleEncryption}>Decrypt/encrypt</Button>
                    </Box>
                    <Backdrop
                        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                        open={loadingIconForModalIsOpen}
                    >
                        <CircularProgress color="inherit" />
                    </Backdrop>
                </Box>

            </Modal>
        </Box>
    );*/
};

export default SmartVault;
