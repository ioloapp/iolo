import * as React from 'react';
import { useNavigate } from "react-router-dom";
import { Home as HomeIcon, LockClock as LockClockIcon, Settings as SettingsIcon} from '@mui/icons-material';
import {
    List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Toolbar, Box, InboxIcon
} from '@mui/material'

function DrawerContent() {

    let navigate = useNavigate();

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
                <ListItem key="Vaults" disablePadding>
                    <ListItemButton onClick={() => navigate('/vault')}>
                        <ListItemIcon>
                            <LockClockIcon />
                        </ListItemIcon>
                        <ListItemText primary="My vaults" />
                    </ListItemButton>
                </ListItem>
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