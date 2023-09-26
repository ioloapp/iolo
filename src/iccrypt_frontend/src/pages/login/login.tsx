// IC
import {useAppDispatch} from "../../redux/hooks";
import {Button} from "@mui/material";
import * as React from "react";
import {loginUserThunk} from "../../redux/user/userSlice";
import {PageLayout} from "../../components/layout/page-layout";


export function Login() {

    const dispatch = useAppDispatch();

    // Login/Logout
    async function handleLogin() {
        dispatch(loginUserThunk())
    }

    return (
        <PageLayout title="IC Crypt">
            <Button variant="contained" onClick={handleLogin}>Log in</Button>
        </PageLayout>
    );
}
