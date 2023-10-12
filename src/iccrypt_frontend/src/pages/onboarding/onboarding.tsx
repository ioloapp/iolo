// IC
import {useAppDispatch} from "../../redux/hooks";
import {Backdrop, Button, CircularProgress, Container, Typography} from "@mui/material";
import * as React from "react";
import {createUserThunk, userActions} from "../../redux/user/userSlice";
import {PageLayout} from "../../components/layout/page-layout";


export function Onboarding() {


    const dispatch = useAppDispatch();
    const [loadingIconIsOpen, setLoadingIcon] = React.useState(false);

    // Login/Logout
    async function createUser() {
        setLoadingIcon(true);
        dispatch(createUserThunk())
        setLoadingIcon(false);
    }

    async function logoutUser() {
        setLoadingIcon(true);
        dispatch(userActions.logOut())
        setLoadingIcon(false);
    }

    return (
        <PageLayout title="Onboarding">
            <Container maxWidth="sm">
                <Typography paragraph>
                    It seems you have not yet created your IC Crypt account. You wanna go for one?
                </Typography>
                <Button variant="contained" sx={{m: '0px auto 0px auto'}} onClick={createUser}>
                    Create Account
                </Button>
                <Button variant="contained" sx={{m: '0px auto 0px auto'}} onClick={logoutUser}>
                    Logout
                </Button>
            </Container>
            <Backdrop
                sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
                open={loadingIconIsOpen}
            >
                <CircularProgress color="inherit"/>
            </Backdrop>
        </PageLayout>
    );
}
