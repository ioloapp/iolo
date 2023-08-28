// IC
import { AuthClient } from "@dfinity/auth-client";
import { getActor } from '../../utils/backend';
import { useAppDispatch } from "../../redux/hooks";
import {hasAccount, logIn } from "../../redux/userSlice";
import { Button } from "@mui/material";
import * as React from "react";


export function Login() {


    const dispatch = useAppDispatch();

    // Login/Logout
    async function handleLogin() {
        const daysToAdd = 7;
        const expiry = Date.now() + (daysToAdd * 86400000);
        const authClient = await AuthClient.create();
        await authClient.login({
            onSuccess: async () => {
                dispatch(logIn(authClient.getIdentity().getPrincipal().toText()));

                // Check if user account is existing (to control which drawers are enabled)
                let actor = await getActor();
                let isUserVaultExisting = await actor.is_user_vault_existing();
                dispatch(hasAccount(isUserVaultExisting));
            },
            identityProvider: process.env.II_URL,
            maxTimeToLive: BigInt(expiry * 1000000)
        });
    }

    return (
        <div>
                <Button color="inherit" onClick={() => {
                    handleLogin();
                }}>Log in</Button>
            </div>
    );
}
