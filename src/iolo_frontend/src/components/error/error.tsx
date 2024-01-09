import * as React from 'react';
import {Box, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";

export interface ErrorProps {
    error: string;
}

export const Error = ({error}: ErrorProps) => {

    const { t } = useTranslation();

    return (
        <Box sx={{
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
        }}>
            <Typography variant="h5" color="#FFB267">{t('error.title')}</Typography>
            <Typography variant="body2" color="#FFB267">{error}</Typography>
        </Box>
    );
}
