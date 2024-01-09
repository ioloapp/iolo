import {Box, Button, FormControlLabel, FormGroup, MenuItem, Select, Switch, Typography} from "@mui/material";
import * as React from "react";
import {useEffect} from "react";
import {getCurrentUserThunk, updateUserThunk, userActions} from "../../redux/user/userSlice";
import {useAppDispatch} from "../../redux/hooks";
import {PageLayout} from "../../components/layout/page-layout";
import {useSelector} from "react-redux";
import {selectCurrentUser, selectMode} from "../../redux/user/userSelectors";
import {UiUser, UiUserType} from "../../services/IoloTypesForUi";
import TextField from "@mui/material/TextField";
import {useTranslation} from "react-i18next";
import i18n from "i18next";
import {supportedLanguage} from "../../locales/i18n";

export function Profile() {

    const dispatch = useAppDispatch();
    const {t} = useTranslation();
    const currentUser = useSelector(selectCurrentUser);
    const darkMode = useSelector(selectMode);

    useEffect(() => {
        if (!currentUser?.name) {
            dispatch(getCurrentUserThunk());
        }
    }, [currentUser]);

    const updateCurrentUser = (user: UiUser) => {
        dispatch(userActions.updateUser(user))
    }

    const updateUser = () => {
        dispatch(updateUserThunk(currentUser));
    }

    const changeUserLanguage = (language: string) => {
        void i18n.changeLanguage(language);
        dispatch(updateUserThunk({
            ...currentUser,
            language
        }));
    }

    const updateMode = () => {
        if (darkMode === 'dark') {
            dispatch(userActions.changeMode('light'));
        } else {
            dispatch(userActions.changeMode('dark'));
        }
    }

    return (
        <PageLayout title={t('profile.title')}>
            <>
                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                    }}
                >
                    <FormGroup>
                        <FormControlLabel control={<Switch value={darkMode === 'dark'} onChange={() => updateMode()}/>}
                                          label={t('profile.mode')}/>
                    </FormGroup>
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
                        <Button variant="contained" sx={{m: '20px auto 0px auto'}} onClick={updateUser}>
                            {t('user.button.update')}
                        </Button>
                </Box>
            </>
        </PageLayout>
    );
}
