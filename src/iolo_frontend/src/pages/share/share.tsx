import {Box, Typography} from "@mui/material";
import * as React from "react";
import {PageLayout} from "../../components/layout/page-layout";
import {useSelector} from "react-redux";
import {selectCurrentUser} from "../../redux/user/userSelectors";
import {QRCodeSVG} from "qrcode.react";
import {StyledAppBar, UserProfile} from "../../components/layout/search-bar";

export function ShareId() {

    const currentUser = useSelector(selectCurrentUser);

    return (
        <PageLayout title="Settings">
            <StyledAppBar position="sticky">
                <UserProfile/>
            </StyledAppBar>
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
        </PageLayout>
    );
}
