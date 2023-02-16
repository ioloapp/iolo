import * as React from 'react';
import {
    Box, 
} from '@mui/material';
import { drawerWidth } from '../config';

const SmartVault = () => {
    
    return (
        <Box sx={{ display: 'flex' }}>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
            >               
            </Box>
        </Box>
    );
};

export default SmartVault;