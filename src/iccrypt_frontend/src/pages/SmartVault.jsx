import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { iccrypt_backend, createActor } from "../../../declarations/iccrypt_backend";
import {
    Box, Button, TextField, Typography
} from '@mui/material';
import { drawerWidth } from '../config/config';

const SmartVault = () => {

    const isLoggedIn = useSelector((state) => state.login.isLoggedIn);
    const [userVault, setUserVault] = useState({isExisting: false});
    let identity; 

    useEffect(() => {
        if (isLoggedIn) checkUserVaults();
    }, []);

    async function prepareActor () {
        let authClient = await AuthClient.create();
        identity = authClient.getIdentity();
        let actor = iccrypt_backend;
        const agent = new HttpAgent({ identity });
        actor = createActor(process.env.ICCRYPT_BACKEND_CANISTER_ID, {
            agent,
        });
        return actor;
    }
    
    async function checkUserVaults() {
        let actor = await prepareActor();
        let isUserVaultExisting = await actor.is_user_vault_existing(identity.getPrincipal());
        setUserVault({
            ...userVault,
            isExisting: isUserVaultExisting,
        });
        if (isUserVaultExisting) {
            let userVault = await actor.get_user_vault(identity.getPrincipal());
            console.log(userVault)
        }
    }

    async function createUserVault() {
        let actor = await prepareActor();
        await actor.create_new_user(identity.getPrincipal());
        setUserVault({
            ...userVault,
            isExisting: await actor.is_user_vault_existing(identity.getPrincipal()),
        });
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
                display="flex" justifyContent="center"
            >
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
                        {!userVault.isExisting &&
                            <Box justifyContent="center">
                                <Typography paragraph>
                                    It seems that you have not created your vault yet. You wanna go for one?
                                </Typography>
                                <TextField size="small" label="Name" variant="filled" />
                                <Button variant="contained" sx={{ ml: 2, mt: 1 }} onClick={() => {
                                    createUserVault();
                                }}>
                                    Create Vault
                                </Button>
                            </Box>
                        }

                        {userVault.isExisting &&
                            <Box justifyContent="center">
                                <Typography paragraph>
                                    Congrats! You have already a vault!
                                </Typography>
                            </Box>
                        }
                    </Box>
                }
            </Box>
        </Box>
    );
};

export default SmartVault;