import * as React from 'react';
import { useSelector } from 'react-redux';
import {
    Box, Typography
} from '@mui/material';
import { drawerWidth } from '../config/config';

const Home = () => {

    const isLoggedIn = useSelector((state) => state.login.isLoggedIn);
    const principal = useSelector((state) => state.login.principal);

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
                display="flex" justifyContent="center"
            >
                <Box >
                    <Typography variant="h3" paragraph>
                        Welcome to IC Crypt
                    </Typography>
                    {isLoggedIn &&
                        <Typography paragraph>
                            Your principal is: {principal}
                        </Typography>}
                    {!isLoggedIn &&
                        <Typography paragraph>
                            Please login to discover the beautiful world of IC Crypt...
                        </Typography>
                    }
                </Box>
            </Box>
        </Box>
    );
};

export default Home;






