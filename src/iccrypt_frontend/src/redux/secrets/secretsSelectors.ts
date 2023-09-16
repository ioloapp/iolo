import {useAppSelector} from "../hooks";

export const selectUserLoggedIn = () => useAppSelector(({user}) => user.principal != undefined);

export const selectUserAccountExisting = () => useAppSelector(({user}) => user.userVaultExisting)
