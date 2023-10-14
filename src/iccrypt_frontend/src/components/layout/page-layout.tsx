import {Box, Typography} from "@mui/material";
import * as React from "react";
import {ReactNode} from "react";

export interface PageLayoutProps {
    title: string
    children: ReactNode
}

export const PageLayout = ({title, children}: PageLayoutProps) => {

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 140px)',
                mt: '70px',
                mb: '70px',
            }}
        >
            <Box
                sx={{
                    padding: 2,
                    textAlign: 'center',
                }}
            >
                <Typography variant="h4">{title}</Typography>
            </Box>

            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex'
                }}
            >
                {children}
            </Box>
        </Box>
    )
}
