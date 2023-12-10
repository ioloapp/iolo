import {Box, Typography} from "@mui/material";
import * as React from "react";
import {PageLayout} from "../../components/layout/page-layout";
import {useSelector} from "react-redux";
import {selectCurrentUser} from "../../redux/user/userSelectors";
import {QRCodeSVG} from "qrcode.react";
import {StyledAppBar, UserProfile} from "../../components/layout/search-bar";

export function ShareId() {
    const currentUser = useSelector(selectCurrentUser);
    const hostname = process.env.NODE_ENV === 'production' ? 'https://' + process.env.IOLO_FRONTEND_CANISTER_ID + '.icp0.io' : 'http://localhost:8080';
    let url = hostname + '/heirs?action=addHeirWithDeepLink&principalType=' + currentUser.type + '&principalId=' + currentUser.id;
    if (currentUser.name) {
        url += '&name=' + currentUser.name;
    }
    if (currentUser.email) {
        url += '&email=' + currentUser.email;
    }

    return (
        <PageLayout title="Share your ID">
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
                        Sharing this QR code allows a person to register you as an heir. Your internet ID is {currentUser.id}
                    </Typography>
                </div>
                <div>
                    <QRCodeSVG value={url} width={300} height={300}/>
                </div>
            </Box>
        </PageLayout>
    );
}
