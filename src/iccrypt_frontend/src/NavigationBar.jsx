import React, { useEffect, useState } from 'react';
import { AppBar, Box, Drawer, IconButton, Toolbar, Typography, Button, Menu, MenuItem } from '@mui/material/';
import { Menu as MenuIcon, AccountCircle } from '@mui/icons-material';
import CssBaseline from '@mui/material/CssBaseline';
import DrawerContent from './DrawerContent';
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { iccrypt_backend, createActor } from "../../declarations/iccrypt_backend";
import { drawerWidth } from './config';

function NavigationBar(props) {
    // See https://github.com/gabrielnic/dfinity-react
    // See https://github.com/dfinity/examples/tree/master/motoko/internet_identity_integration for internet identity integration

    const { window } = props;
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const [principal, setPrincipal] = useState();
    const [isLoggedIn, setIsLoggedIn] = useState(null);
    const [anchorEl, setAnchorEl] = React.useState(null);

    useEffect(() => {
        isAuth();
    }, [principal]);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const isAuth = async () => {
        const authClient = await AuthClient.create();
        let loginState = await authClient.isAuthenticated();
        setIsLoggedIn(loginState);
        
        // In the beginning principal is empty...
        if (loginState) {
            setPrincipal(await authClient.getIdentity().getPrincipal().toText());
        }
    }

    async function handleLogout() {
        const authClient = await AuthClient.create();
        await authClient.logout();
        setPrincipal(await authClient.getIdentity().getPrincipal().toText());
        setAnchorEl(null);
    }

    async function handleLogin() {
        const daysToAdd = 7;
        const expiry = Date.now() + (daysToAdd * 86400000);
        const authClient = await AuthClient.create();
        await authClient.login({
            onSuccess: async () => {
                setPrincipal(authClient.getIdentity().getPrincipal().toText());
                let actor = iccrypt_backend;
                const identity = authClient.getIdentity();
                const agent = new HttpAgent({ identity });
                actor = createActor(process.env.ICCRYPT_BACKEND_CANISTER_ID, {
                    agent,
                });
                const response = await actor.who_am_i();
                console.log("RESPONSE: ", response);
            },
            identityProvider: process.env.II_URL,
            maxTimeToLive: BigInt(expiry * 1000000)
        });
    }

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        IC Crypt
                    </Typography>
                    {!isLoggedIn &&
                        <Button color="inherit" onClick={() => {
                            handleLogin();
                        }}>Log in</Button>
                    }
                    {isLoggedIn &&
                        <Box>
                            <IconButton
                                size="large"
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleMenu}
                                color="inherit"
                            >
                                <AccountCircle />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem onClick={handleClose}>{principal}</MenuItem>
                                <MenuItem onClick={handleLogout}>Log out</MenuItem>
                            </Menu>
                        </Box>}
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
                <Drawer
                    container={container}
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    <DrawerContent />
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    <DrawerContent />
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
            >
                <Toolbar />
            </Box>
        </Box>
    );
}

export default NavigationBar;
