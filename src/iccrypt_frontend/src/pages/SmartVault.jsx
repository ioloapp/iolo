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
    const [isUsersafeExisting, setUsersafeState] = useState(false);
    let identity; 

    useEffect(() => {
        if (isLoggedIn) checkSafes();
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
    
    async function checkSafes() {
        let actor = await prepareActor()
        setUsersafeState(await actor.is_user_safe_existing(identity.getPrincipal()));
    }

    async function createSafe() {
        let actor = await prepareActor();
        let result = await actor.get_user_safe(identity.getPrincipal());
        console.log(result);
        await checkSafes();
        console.log(isUsersafeExisting)
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
                        {!isUsersafeExisting &&
                            <Box justifyContent="center">
                                <Typography paragraph>
                                    It seems that you have not created your safe yet. You wanna go for one?
                                </Typography>
                                <TextField size="small" label="Name" variant="filled" />
                                <Button variant="contained" sx={{ ml: 2, mt: 1 }} onClick={() => {
                                    createSafe();
                                }}>
                                    Create Safe
                                </Button>
                            </Box>
                        }

                        {isUsersafeExisting &&
                            <Box ustifyContent="center">
                                <Typography paragraph>
                                    Here we go....
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