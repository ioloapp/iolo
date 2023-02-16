import * as React from 'react';
import { useNavigate } from "react-router-dom";
import {MoveToInbox } from '@mui/icons-material';
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
                    <ListItemButton onClick={() => navigate('/vault')}>
                        <ListItemIcon>
                            <MoveToInbox />
                        </ListItemIcon>
                        <ListItemText primary="Home" />
                    </ListItemButton>
                </ListItem>
                <ListItem key="Inbox" disablePadding>
                    <ListItemButton onClick={() => navigate('/settings')}>
                        <ListItemIcon>
                            <MoveToInbox />
                        </ListItemIcon>
                        <ListItemText primary="My vault" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );
}

export default DrawerContent;