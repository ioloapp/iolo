// IC
import {useAppDispatch} from "../../redux/hooks";
import {Button} from "@mui/material";
import * as React from "react";
import IcCryptService from "../../services/IcCryptService";
import {hasAccount, logIn} from "../../redux/userSlice";


export function Login() {

    const icCryptService = new IcCryptService();

    const dispatch = useAppDispatch();

    // Login/Logout
    async function handleLogin() {
        await icCryptService.login((principal: string) => dispatch(logIn(principal)));
        dispatch(hasAccount(await icCryptService.isUserVaultExisting()));
    }

    return (
        <div>
            <Button color="inherit" onClick={handleLogin}>Log in</Button>
        </div>
    );
}
