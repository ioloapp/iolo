import * as React from 'react';
import { useNavigate } from "react-router-dom";
import { Home as HomeIcon, LockClock as LockClockIcon, Settings as SettingsIcon } from '@mui/icons-material';
import {
    List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Toolbar, Box, InboxIcon
} from '@mui/material'
import { useSelector } from 'react-redux';

function DrawerContent() {

    let navigate = useNavigate();
    const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
    const isAccountExisting = useSelector((state) => state.user.hasAccount);

    return (
        <Box>
            <Toolbar />
            <Divider />
            <List>
                <ListItem key="Home" disablePadding>
                    <ListItemButton onClick={() => navigate('/home')}>
                        <ListItemIcon>
                            <HomeIcon />
                        </ListItemIcon>
                        <ListItemText primary="Home" />
                    </ListItemButton>
                </ListItem>
                {isLoggedIn && isAccountExisting && 
                    <ListItem key="Vaults" disablePadding>
                        <ListItemButton onClick={() => navigate('/vault')}>
                            <ListItemIcon>
                                <LockClockIcon />
                            </ListItemIcon>
                            <ListItemText primary="My vault" />
                        </ListItemButton>
                    </ListItem>
                }

                <ListItem key="Settings" disablePadding>
                    <ListItemButton onClick={() => navigate('/settings')}>
                        <ListItemIcon>
                            <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Settings" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );
}

export default DrawerContent;