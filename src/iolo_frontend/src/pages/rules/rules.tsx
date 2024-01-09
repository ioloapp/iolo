import {Box, FormControlLabel, FormGroup, Switch} from "@mui/material";
import * as React from "react";
import {PageLayout} from "../../components/layout/page-layout";
import {useTranslation} from "react-i18next";

export function Rules() {

    const { t } = useTranslation();

    return (
        <PageLayout title={t('rules.title')}>
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
                        <FormControlLabel disabled control={<Switch/>} label={t('rules.dead-man-switch.button')}/>
                    </FormGroup>
                </Box>
            </>
        </PageLayout>
    );
}
