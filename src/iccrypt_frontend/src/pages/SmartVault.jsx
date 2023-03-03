import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box, Typography, List, ListItem, IconButton, ListItemText
} from '@mui/material';
import {Edit as EditIcon} from '@mui/icons-material';
import { getActor } from '../utils/backend';
import { setAccountState } from '../redux/userSlice';



const SmartVault = () => {

    const dispatch = useDispatch();

    useEffect(() => {
        getUserVault();
    }, []);

    async function getUserVault() {
        
        let actor = await getActor();
        let userVault = await actor.get_user_vault();
        console.log(userVault);
    }

    return (
        <Box >
            
        </Box>
    );
};

export default SmartVault;