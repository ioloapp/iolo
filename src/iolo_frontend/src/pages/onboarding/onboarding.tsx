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
import {supportedLanguage} from "../../locales/i18n";
import i18n from "i18next";
import useWindowResize from "../../utils/useWindowResize";


export const Onboarding = () => {

    const dispatch = useAppDispatch();
    const {t} = useTranslation();
    const currentUser = useSelector(selectCurrentUser);
    const [loadingIconIsOpen, setLoadingIcon] = React.useState(false);
    const {width} = useWindowResize();

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

    const changeUserLanguage = (language: string) => {
        void i18n.changeLanguage(language);
        dispatch(userActions.updateUser({
            ...currentUser,
            language
        }));
    }

    return (
        <PageLayout title={t('onboarding.title')} showAppBar={true} withMenu={false}>
            <>
                <Container maxWidth="sm">
                    <Typography paragraph>
                        {t('onboarding.text')}
                    </Typography>
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%'
                        }}
                    >
                        <div className="input-field">
                            <Typography variant="body2">{t('user.type')}</Typography>
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
                        </div>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="name"
                            label={t('user.name')}
                            InputLabelProps={{shrink: true}}
                            fullWidth
                            variant="standard"
                            value={currentUser?.name}
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
                            value={currentUser?.email}
                            onChange={e => updateCurrentUser({
                                ...currentUser,
                                email: e.target.value
                            })}
                        />
                        <div className="input-field">
                            <Typography variant="body2">{t('user.language')}</Typography>
                            <Select
                                id="language-select"
                                value={currentUser?.language}
                                label={t('user.language')}
                                onChange={e => changeUserLanguage(
                                    e.target.value
                                )}
                                sx={{width: '100%'}}
                            >
                                {supportedLanguage
                                    .map(language => {
                                        return <MenuItem key={language} value={language}>{language}</MenuItem>
                                    })

                                }
                            </Select>
                        </div>
                        <Button variant="contained" sx={{m: '20px auto 0px auto'}} onClick={createUser}>
                            {t('user.button.create')}
                        </Button>
                    </Box>
                </Container>
                <Backdrop
                    sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
                    open={loadingIconIsOpen}
                >
                    <CircularProgress color="secondary"/>
                </Backdrop>
            </>
        </PageLayout>
    );
}
