import {RootState} from "../store";

export const selectPrincipal = (state: RootState) => state.user.principal;

export const selectUserAccountExistingForCurrentUser = (state: RootState) => state.user.userVaultExisting;

export const selectCurrentUser = (state: RootState) => state.user.user;

export const selectLoginStatus = (state: RootState) => state.user.loginStatus

export const selectMode = (state: RootState) => state.user.mode;
