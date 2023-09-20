// IC
import {useAppDispatch} from "../../redux/hooks";
import {Button} from "@mui/material";
import * as React from "react";
import {loginUserThunk} from "../../redux/user/userSlice";


export function Login() {

    const dispatch = useAppDispatch();

    // Login/Logout
    async function handleLogin() {
        dispatch(loginUserThunk())
    }

    return (
        <div>
            <Button color="inherit" onClick={handleLogin}>Log in</Button>
        </div>
    );
}
