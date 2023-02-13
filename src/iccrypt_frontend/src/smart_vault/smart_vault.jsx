
import React, { useEffect } from "react";
import { experimentalStyled as styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
//import { Principal } from "@dfinity/principal";
import { AuthClient } from "@dfinity/auth-client";
import { iccrypt_backend } from "../../../declarations/iccrypt_backend";

const SmartVault = (props) => {
    // See https://github.com/gabrielnic/dfinity-react
    useEffect(() => {
        //let isExisting = iccrypt_backend.is_user_safe_existing("foo");
        //console.log(isExisting);
        isAuth()
    }, []);

    const isAuth = async () => {
        const authClient = await AuthClient.create();
        await new Promise((resolve, reject) => {
            authClient.login({
                onSuccess: resolve,
                onError: reject,
                maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
                ...(process.env.NODE_ENV === 'development' && { identityProvider: `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}#authorize` })
            });
        });
        /*if (isAuth) {
            setLogged(true);
        }*/
    }
    const [name, setName] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [secrets, setSecrets] = React.useState([]);

    async function whoAmI() {
        const greeting = await iccrypt_backend.who_am_i();
        setMessage(greeting);
    }

    async function getAllSecrets() {
        const secrets = await iccrypt_backend.secrets();
        setSecrets(secrets);
        console.log("the secrets: ");
        console.log(secrets);
    }
    async function handleLogin() {
        const daysToAdd = 7;
        const expiry = Date.now() + (daysToAdd * 86400000);
        const authClient = await AuthClient.create();
        await authClient.login({
            onSuccess: async () => {
                BackendActor.setAuthClient(authClient);
                const ba = await BackendActor.getBackendActor();
                const principal = await ba.whoami();
                setIdentity(principal.toText());
                // eslint-disable-next-line no-restricted-globals
                location.reload();
            },
            identityProvider: "http://localhost:4943?canisterId=" + process.env.REACT_APP_CANISTER_ID,
            maxTimeToLive: BigInt(expiry * 1000000)
        });
    }
    async function addTestSecrests() {
        let test_secret = {
            "id": "name of thisusername1www.super.com",
            "url": "www.super.com",
            "username": "username1",
            "password": "password1",
            "name": "name of this",
            "category": {
                "Password": null
            }
        };
        console.log("gonna add test secrets");
        await iccrypt_backend.add_test_secrets();
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                <Grid xs={2} sm={4} md={4} />
                <Grid xs={2} sm={4} md={4} display="flex" justifyContent="center" alignItems="center">
                    <Button variant="outlined" onClick={() => {
                        handleLogin();
                    }}>Log in</Button>
                </Grid>
                <Grid xs={2} sm={4} md={4} />
            </Grid>
        </Box>
    );

};

export default SmartVault;






