// IC
import {useAppDispatch} from "../../redux/hooks";
import {Box, Button, CircularProgress} from "@mui/material";
import * as React from "react";
import {useState} from "react";
import {loginUserThunk} from "../../redux/user/userSlice";
import {PageLayout} from "../../components/layout/page-layout";


export function Login() {

    const dispatch = useAppDispatch();

    const [loading, setLoading] = useState(false);

    // Login/Logout
    async function handleLogin() {
        setLoading(true);
        dispatch(loginUserThunk());
    }

    return (
        <PageLayout title="IC Crypt">
            {loading &&
                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <CircularProgress/>
                </Box>
            }
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
