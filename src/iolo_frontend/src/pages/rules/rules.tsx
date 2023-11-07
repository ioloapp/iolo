import {Box, FormControlLabel, FormGroup, Switch} from "@mui/material";
import * as React from "react";
import {PageLayout} from "../../components/layout/page-layout";
import {StyledAppBar, UserProfile} from "../../components/layout/search-bar";

export function Rules() {

    return (
        <PageLayout title="Rules">
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
                <FormGroup>
                    <FormControlLabel disabled control={<Switch/>} label="Dead man switch"/>
                </FormGroup>
            </Box>
        </PageLayout>
    );
}
