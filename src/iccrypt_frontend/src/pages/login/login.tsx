// IC
import {useAppDispatch} from "../../redux/hooks";
import {Button} from "@mui/material";
import * as React from "react";
import IcCryptService from "../../services/IcCryptService";
import {userActions} from "../../redux/user/userSlice";


export function Login() {

    const icCryptService = new IcCryptService();

    const dispatch = useAppDispatch();

    // Login/Logout
    async function handleLogin() {
        const principal = await icCryptService.login();
        if(principal){
            dispatch(userActions.logIn(principal.toText()));
            dispatch(userActions.setUserVaultExisting(await icCryptService.isUserVaultExisting()));
        }
    }

    return (
        <div>
            <Button color="inherit" onClick={handleLogin}>Log in</Button>
        </div>
    );
}
