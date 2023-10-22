import {Box, Button, Typography} from "@mui/material";
import * as React from "react";
import {userActions} from "../../redux/user/userSlice";
import {useAppDispatch} from "../../redux/hooks";
import {PageLayout} from "../../components/layout/page-layout";
import {useSelector} from "react-redux";
import {selectCurrentUser} from "../../redux/user/userSelectors";
import {QRCodeSVG} from "qrcode.react";

export function Settings() {

    const dispatch = useAppDispatch();
    const currentUser = useSelector(selectCurrentUser);

    const logout = () => {
        dispatch(userActions.logOut());
    }

    return (
        <PageLayout title="Settings">
            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}
            >
                <div>
                    <Typography paragraph>
                        Your Internet ID: {currentUser.id}
                    </Typography>
                </div>
                <div>
                    <QRCodeSVG value={currentUser.id} width={300} height={300}/>
                </div>
            </Box>
            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '20px'
                }}
            >
                <Button variant="contained" onClick={logout}>Logout</Button>
            </Box>
        </PageLayout>
    );
}
