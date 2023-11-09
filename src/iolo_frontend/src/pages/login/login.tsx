// IC
import {useAppDispatch} from "../../redux/hooks";
import {Box, Button, CircularProgress} from "@mui/material";
import * as React from "react";
import {loginUserThunk} from "../../redux/user/userSlice";
import {PageLayout} from "../../components/layout/page-layout";
import {useSelector} from "react-redux";
import {selectLoginStatus} from "../../redux/user/userSelectors";


export function Login() {

    const dispatch = useAppDispatch();

    const loadingState = useSelector(selectLoginStatus);

    // Login/Logout
    async function handleLogin() {
        dispatch(loginUserThunk());
    }

    return (
        <PageLayout title="IOLO">
            {loadingState === 'pending' &&
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
            {loadingState !== 'pending' &&<Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Button variant="contained" onClick={handleLogin}>Log in</Button>
            </Box>}
        </PageLayout>
    );
}
