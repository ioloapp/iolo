import {useAppSelector} from "../hooks";

export const selectUserLoggedIn = () => useAppSelector(({user}) => user.principal != undefined);

export const selectUserAccountExistingForCurrentUser = () => useAppSelector(({user}) => user.userVaultExisting);

export const selectCurrentUser = () => useAppSelector(({user}) => user.user)

export const selectLoginStatus = () => useAppSelector(({user}) => user.loginStatus)
