import {Button, Typography} from "@mui/material";
import * as React from "react";
import {userActions} from "../../redux/user/userSlice";
import {useAppDispatch} from "../../redux/hooks";

export function Settings() {

    const dispatch = useAppDispatch();
    const logout = () => {
        dispatch(userActions.logOut());
    }

    return (<>
        <Typography variant="h4">Settings</Typography>
        <Button variant="contained" onClick={logout}>Logout</Button>
    </>);
}
