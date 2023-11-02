import * as React from 'react';
import {Box, Typography} from "@mui/material";

export interface ErrorProps {
    error: string;
}

export const Error = ({error}: ErrorProps) => {

    return (
        <Box sx={{
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
        }}>
            <Typography variant="h5" color="#FFB267">Error</Typography>
            <Typography variant="body2" color="#FFB267">{error}</Typography>
        </Box>
    );
}
