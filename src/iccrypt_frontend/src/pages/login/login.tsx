// IC
import {useAppDispatch} from "../../redux/hooks";
import {Box, Button} from "@mui/material";
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
            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Button variant="contained" onClick={handleLogin}>Log in</Button>
            </Box>
        </PageLayout>
    );
}
