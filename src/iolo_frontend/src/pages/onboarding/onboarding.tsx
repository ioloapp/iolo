// IC
import {useAppDispatch} from "../../redux/hooks";
import {Backdrop, Box, Button, CircularProgress, Container, MenuItem, Select, Typography} from "@mui/material";
import * as React from "react";
import {createUserThunk, userActions} from "../../redux/user/userSlice";
import {PageLayout} from "../../components/layout/page-layout";
import {UiUser, UiUserType} from "../../services/IoloTypesForUi";
import TextField from "@mui/material/TextField";
import {useSelector} from "react-redux";
import {selectCurrentUser} from "../../redux/user/userSelectors";
import {useTranslation} from "react-i18next";


export const Onboarding = () => {

    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const currentUser = useSelector(selectCurrentUser);
    const [loadingIconIsOpen, setLoadingIcon] = React.useState(false);

    // Login/Logout
    const createUser = () => {
        setLoadingIcon(true);
        dispatch(createUserThunk(currentUser));
        setLoadingIcon(false);
    }

    const logoutUser = () => {
        setLoadingIcon(true);
        dispatch(userActions.logOut())
        setLoadingIcon(false);
    }

    const updateCurrentUser = (user: UiUser) => {
        dispatch(userActions.updateUser(user))
    }

    return (
        <PageLayout title={t('onboarding.title')}>
            <>
                <Container maxWidth="sm">
                    <Typography paragraph>
                        It seems you have not yet created your iolo account. You wanna go for one?
                    </Typography>
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column'
                        }}
                    >
                        <Typography variant="body2">Type of user</Typography>
                        <Select
                            id="usertype-select"
                            value={currentUser?.type}
                            label={t('user.type')}
                            onChange={e => updateCurrentUser({
                                ...currentUser,
                                type: UiUserType[e.target.value as keyof typeof UiUserType]
                            })}
                            sx={{width: '100%'}}
                        >
                            {Object.keys(UiUserType)
                                .map(key => {
                                    return <MenuItem key={key} value={key}>{key}</MenuItem>
                                })

                            }
                        </Select>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="name"
                            label={t('user.name')}
                            InputLabelProps={{shrink: true}}
                            fullWidth
                            variant="standard"
                            value={currentUser.name}
                            onChange={e => updateCurrentUser({
                                ...currentUser,
                                name: e.target.value
                            })}
                        />
                        <TextField
                            autoFocus
                            margin="dense"
                            id="email"
                            label={t('user.email')}
                            InputLabelProps={{shrink: true}}
                            fullWidth
                            variant="standard"
                            value={currentUser.email}
                            onChange={e => updateCurrentUser({
                                ...currentUser,
                                email: e.target.value
                            })}
                        />
                        <Button variant="contained" sx={{m: '0px auto 0px auto'}} onClick={createUser}>
                            {t('user.button.create')}
                        </Button>
                    </Box>
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '3rem'
                        }}
                    >
                        <Button variant="contained" sx={{m: '0px auto 0px auto'}} onClick={logoutUser}>
                            Logout
                        </Button>
                    </Box>
                </Container>
                <Backdrop
                    sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
                    open={loadingIconIsOpen}
                >
                    <CircularProgress color="inherit"/>
                </Backdrop>
            </>
        </PageLayout>
    );
}
