import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box, Typography, List, ListItem, IconButton, ListItemText, TextField, Button, Select, MenuItem
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { getActor } from '../utils/backend';
import { setAccountState } from '../redux/userSlice';
import KeyIcon from '@mui/icons-material/Key';
import DeleteIcon from '@mui/icons-material/Delete';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';



const SmartVault = () => {

    const dispatch = useDispatch();
    const [value, setValue] = useState("");

    useEffect(() => {
        getUserVault();
    }, []);

    async function getUserVault() {

        let actor = await getActor();
        let userVault = await actor.get_user_vault();
        console.log(userVault);
    }

    async function addSecret() {
        let actor = await getActor();
        // var secret_category: SecretCategory;
        // var secret_category: actor.SecretCategory;
        // let userSecret = await actor.add_user_secret("Password");
        let userVault = await actor.get_user_vault();
        console.log(userVault);
    }

    function handleChange(e) {
        setValue({ input: e.target.value });
        console.log(e.target.value);
    }




    return (
        <Box >
            <Box>
                <Typography variant="h3" paragraph>
                    Let's add a new secret
                </Typography>
                <Typography paragraph>
                    Select type
                </Typography>
                <Select
                    id="category-selection"
                    value="Type"
                    label="Type"
                // onChange={handleChange}
                >
                    <MenuItem value={10}>Password</MenuItem>
                    <MenuItem value={20}>Note</MenuItem>
                    <MenuItem value={30}>Wallet</MenuItem>
                </Select>
                <Typography paragraph>
                    Name of your secret
                </Typography>
                <TextField size="small" label="Name" variant="filled" onChange={handleChange} />

                <Button variant="contained" sx={{ ml: 2, mt: 1 }} onClick={() => {
                    addSecret();
                }}>
                    Add secret
                </Button>
            </Box>
            <List>

                <ListItem
                    secondaryAction={
                        <IconButton edge="end" aria-label="delete">
                            <DeleteIcon />
                        </IconButton>
                    }
                >
                    <ListItemAvatar>
                        <Avatar>
                            <KeyIcon />
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                        primary="www.google.com"
                        secondary={'myusername@gmail.com'}
                    />
                </ListItem>

            </List>
        </Box>
    );
};

export default SmartVault;