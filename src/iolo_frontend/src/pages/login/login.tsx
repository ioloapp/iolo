// IC
import {useAppDispatch} from "../../redux/hooks";
import {Box, Button, CircularProgress} from "@mui/material";
import * as React from "react";
import {loginUserThunk} from "../../redux/user/userSlice";
import {PageLayout} from "../../components/layout/page-layout";
import {useSelector} from "react-redux";
import {selectLoginStatus} from "../../redux/user/userSelectors";
import {IoloLogo} from "../../resources/logo";
import {useTranslation} from "react-i18next";
import './login.css';


export function Login() {

    const dispatch = useAppDispatch();
    const { t } = useTranslation();

    const loadingState = useSelector(selectLoginStatus);

    // Login/Logout
    async function handleLogin() {
        dispatch(loginUserThunk());
    }

    return (
        <PageLayout title="" showAppBar={false}>
            <>
                <IoloLogo/>
                {loadingState === 'pending' &&
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <CircularProgress color="secondary"/>
                    </Box>
                }
                {loadingState !== 'pending' && <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Button variant="contained" onClick={handleLogin} className="login-button">{t('login.button')}</Button>
                </Box>}
            </>
        </PageLayout>
    );
}
