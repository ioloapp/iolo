import {Box, FormControlLabel, FormGroup, Switch} from "@mui/material";
import * as React from "react";
import {PageLayout} from "../../components/layout/page-layout";

export function Rules() {

    return (
        <PageLayout title="Rules">
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
                        <FormControlLabel disabled control={<Switch/>} label="Dead man switch"/>
                    </FormGroup>
                </Box>
            </>
        </PageLayout>
    );
}
