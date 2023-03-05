import * as React from 'react';
import { useNavigate } from "react-router-dom";

// Redux
import { useAppSelector } from '../../redux/hooks'; // for typescript

// MUI
import { Home as HomeIcon, LockClock as LockClockIcon, Settings as SettingsIcon } from '@mui/icons-material';
import {
    List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Toolbar, Box
} from '@mui/material'

function DrawerContent() {

    let navigate = useNavigate();
    const isLoggedIn = useAppSelector((state) => state.user.isLoggedIn);
    const hasAccount = useAppSelector((state) => state.user.hasAccount);

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
                {isLoggedIn && hasAccount &&
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