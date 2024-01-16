import {Box, Typography} from "@mui/material";
import * as React from "react";
import {PageLayout} from "../../components/layout/page-layout";
import {useSelector} from "react-redux";
import {selectCurrentUser} from "../../redux/user/userSelectors";
import {QRCodeSVG} from "qrcode.react";
import {useTranslation} from "react-i18next";
import {ROUTE_POLICIES} from "../../components/layout/routes";

export function ShareId() {
    const currentUser = useSelector(selectCurrentUser);
    const { t } = useTranslation();
    const hostname = process.env.NODE_ENV === 'production' ? 'https://' + process.env.IOLO_FRONTEND_CANISTER_ID + '.icp0.io' : 'http://localhost:8080';
    let url = hostname + ROUTE_POLICIES + '?action=addHeirWithDeepLink&principalType=' + currentUser.type + '&principalId=' + currentUser.id;
    if (currentUser.name) {
        url += '&name=' + currentUser.name;
    }
    if (currentUser.email) {
        url += '&email=' + currentUser.email;
    }

    return (
        <PageLayout title={t('share.title')}>
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
                    <div>
                        <Typography paragraph>
                            {t('share.info')}Sharing this QR code allows a person to register you as an heir.
                        </Typography>
                    </div>
                    <div>
                        <QRCodeSVG value={url} width={150} height={150}/>
                    </div>
                    <div>
                        <Typography paragraph>
                            {t('share.own-id')}{currentUser.id}
                        </Typography>
                    </div>
                </Box>
            </>
        </PageLayout>
    );
}
