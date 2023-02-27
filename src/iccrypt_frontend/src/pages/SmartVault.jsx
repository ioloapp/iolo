import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box, Typography
} from '@mui/material';
import { getActor } from '../utils/backend';
import { setAccountState } from '../redux/userSlice';



const SmartVault = () => {

    const dispatch = useDispatch();
    const isLoggedIn = useSelector((state) => state.user.isLoggedIn);

    useEffect(() => {
        if (isLoggedIn) checkUserVaults();
    }, []);

    async function checkUserVaults() {
        let actor = await getActor();
        let isUserVaultExisting = await actor.is_user_vault_existing();
        dispatch(setAccountState(isUserVaultExisting));
    }

    return (
        <Box >
            {!isLoggedIn &&
                <Box >
                    <Typography variant="h3" paragraph>
                        Welcome to IC Crypt
                    </Typography>
                    <Typography paragraph>
                        Please login to discover the beautiful world of IC Crypt...
                    </Typography>
                </Box>
            }
            {isLoggedIn &&
                <Box>
                </Box>
            }
        </Box>
    );
};

export default SmartVault;