import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box, Typography, TextField, Button
} from '@mui/material';
import { getActor } from '../utils/backend';
import { setAccountState } from '../redux/userSlice';

const Home = () => {

    const dispatch = useDispatch();
    const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
    const principal = useSelector((state) => state.user.principal);
    const isAccountExisting = useSelector((state) => state.user.hasAccount);

    useEffect(() => {
        if (isLoggedIn) {
            checkUserVault();
        }
    }, []);

    async function checkUserVault() {
        let actor = await getActor();
        let isUserVaultExisting = await actor.is_user_vault_existing();
        dispatch(setAccountState(isUserVaultExisting));
    }

    async function createUser() {
        let actor = await getActor();
        await actor.create_user();
        dispatch(setAccountState(true));
    }

    return (
        <Box >
            <Typography variant="h3" paragraph>
                Welcome to IC Crypt
            </Typography>
            {isLoggedIn &&
                <Box>
                    <Typography paragraph>
                        Your principal is: {principal}
                    </Typography>
                    {!isAccountExisting &&
                        <Box justifyContent="center">
                            <Typography paragraph>
                                It seems you have not yet created your IC Crypt account. You wanna go for one?
                            </Typography>
                            <TextField size="small" label="Name" variant="filled" />
                            <Button variant="contained" sx={{ ml: 2, mt: 1 }} onClick={() => {
                                createUser();
                            }}>
                                Create Account
                            </Button>
                        </Box>
                    }
                    {isAccountExisting &&
                        <Box justifyContent="center">
                            <Typography paragraph>
                                Congrats! You have already an account!
                            </Typography>
                        </Box>
                    }
                </Box>
            }
            {!isLoggedIn &&
                <Typography paragraph>
                    Please login to discover the beautiful world of IC Crypt...
                </Typography>
            }

        </Box>
    );
};

export default Home;






