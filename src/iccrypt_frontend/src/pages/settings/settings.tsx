import {Button} from "@mui/material";
import * as React from "react";
import {userActions} from "../../redux/user/userSlice";
import {useAppDispatch} from "../../redux/hooks";
import {PageLayout} from "../../components/layout/page-layout";

export function Settings() {

    const dispatch = useAppDispatch();
    const logout = () => {
        dispatch(userActions.logOut());
    }

    return (
        <PageLayout title="Settings">
            <Button variant="contained" onClick={logout}>Logout</Button>
        </PageLayout>
    );
}
