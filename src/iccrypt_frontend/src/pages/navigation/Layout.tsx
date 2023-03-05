import * as React from 'react';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

// Redux
import { useAppSelector, useAppDispatch } from '../../redux/hooks'; // for typescript
import { hasAccount } from '../../redux/userSlice';
import { logIn, logOut } from '../../redux/userSlice';

// MUI
import { AppBar, Box, Drawer, IconButton, Toolbar, Typography, Button, Menu, MenuItem, CssBaseline } from '@mui/material/';
import { Menu as MenuIcon, AccountCircle } from '@mui/icons-material';

// Components
import { drawerWidth } from '../../config/config';
import DrawerContent from './DrawerContent';

// IC
import { AuthClient } from "@dfinity/auth-client";
import { getActor } from '../../utils/backend';


function Layout(props) {
    // See https://github.com/gabrielnic/dfinity-react
    // See https://github.com/dfinity/examples/tree/master/motoko/internet_identity_integration for internet identity integration

    const { window } = props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    let navigate = useNavigate();

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const dispatch = useAppDispatch();
    const isLoggedIn = useAppSelector((state) => state.user.isLoggedIn);
    const principal = useAppSelector((state) => state.user.principal);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    useEffect(() => {
        isAuth();
        checkUserVault();
    }, []);

    const isAuth = async () => {
        const authClient = await AuthClient.create();
        let isAuthenticated = await authClient.isAuthenticated();
        if (isAuthenticated) {
            dispatch(logIn(authClient.getIdentity().getPrincipal().toText()));
        } else {
            dispatch(logOut());
        }
    }

    async function checkUserVault() {
        let actor = await getActor();
        //let isUserVaultExisting = await actor.is_user_vault_existing();
        let isUserVaultExisting = true;
        dispatch(hasAccount(isUserVaultExisting));
    }

    async function handleLogout() {
        const authClient = await AuthClient.create();
        await authClient.logout();
        dispatch(logOut());
        setAnchorEl(null);  // Close profile menu
        navigate('/home');
    }

    async function handleLogin() {
        const daysToAdd = 7;
        const expiry = Date.now() + (daysToAdd * 86400000);
        const authClient = await AuthClient.create();
        await authClient.login({
            onSuccess: async () => {
                dispatch(logIn(authClient.getIdentity().getPrincipal().toText()));

                // Check if user account is existing (to control which drawers are enabled)
                let actor = await getActor();
                let isUserVaultExisting = await actor.is_user_vault_existing();
                dispatch(hasAccount(isUserVaultExisting));
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
                <Box sx={{ display: 'flex' }}>
                    <Box
                        component="main"
                        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
                        display="flex" justifyContent="center"
                    >
                        <Outlet />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default Layout;
