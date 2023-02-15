
import React, { useEffect, useState } from "react";
import { experimentalStyled as styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
//import { Principal } from "@dfinity/principal";
import { AuthClient } from "@dfinity/auth-client";
import {HttpAgent} from "@dfinity/agent";
import { iccrypt_backend, createActor } from "../../../declarations/iccrypt_backend";

const SmartVault = (props) => {
    // See https://github.com/gabrielnic/dfinity-react

    const [principal, setPrincipal] = useState('n/a');
    const [isLoggedIn, setIsLoggedIn] = useState('');

    useEffect(() => {
        isAuth();
    }, [principal]);

    const isAuth = async () => {
        const authClient = await AuthClient.create();
        setIsLoggedIn(await authClient.isAuthenticated());
    }

    async function handleLogout() {
        const authClient = await AuthClient.create();
        await authClient.logout();
        setPrincipal(authClient.getIdentity().getPrincipal().toText());
    }

    async function handleLogin() {
        const daysToAdd = 7;
        const expiry = Date.now() + (daysToAdd * 86400000);
        const authClient = await AuthClient.create();
        await authClient.login({
            onSuccess: async () => {
                setPrincipal(authClient.getIdentity().getPrincipal().toText());
                //BackendActor.setAuthClient(authClient);
                //const ba = await BackendActor.getBackendActor();
                //const principal = await ba.whoami();
                //setIdentity(authClient.principal);
                // eslint-disable-next-line no-restricted-globals
                //location.reload();
            },
            ...(process.env.NODE_ENV === 'development' && { identityProvider: `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}#authorize` }),
            //identityProvider: "http://localhost:4943?canisterId=" + process.env.REACT_APP_CANISTER_ID,
            maxTimeToLive: BigInt(expiry * 1000000)
        });
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                <Grid xs={2} sm={4} md={6} display="flex" justifyContent="center" alignItems="center">
                    <TextField id="principal" label="Principal" variant="outlined" value={principal} InputProps={{
                        readOnly: true,
                    }} />
                </Grid>
                <Grid xs={2} sm={4} md={6} display="flex" justifyContent="center" alignItems="center">
                    <TextField id="login-status" label="isUserLoggedIn?" variant="outlined" value={isLoggedIn} InputProps={{
                        readOnly: true,
                    }} />
                </Grid>
                <Grid xs={2} sm={4} md={4} />
                <Grid xs={2} sm={4} md={4} display="flex" justifyContent="center" alignItems="center">
                    {!isLoggedIn && <Button variant="outlined" onClick={() => {
                        handleLogin();
                    }}>Log in</Button>}
                </Grid>
                <Grid xs={2} sm={4} md={4} />
                <Grid xs={2} sm={4} md={4} />
                <Grid xs={2} sm={4} md={4} display="flex" justifyContent="center" alignItems="center">
                    {isLoggedIn && <Button variant="outlined" onClick={() => {
                        handleLogout();
                    }}>Log out</Button>}
                </Grid>
                <Grid xs={2} sm={4} md={4} />
            </Grid>
        </Box>
    );

};

export default SmartVault;