import {Divider, Drawer, List, ListItem, ListItemIcon, ListItemText} from "@mui/material";
import * as React from "react";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import {Link} from "react-router-dom";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {LogoIcon} from "../../layout/search-bar";
import './sidbar.css';
import {userActions} from "../../../redux/user/userSlice";
import {useAppDispatch} from "../../../redux/hooks";
import {sidebarWith} from "../../../App";

export const SideBar = () => {

    const dispatch = useAppDispatch();

    const handleLogout = () => {
        dispatch(userActions.logOut());
    };

    return (
        <Drawer
            sx={{
                width: sidebarWith,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: sidebarWith,
                    boxSizing: 'border-box',
                    background: '#1C5264',
                    color: '#FFFFFF'
                },
            }}
            variant="permanent"
            anchor="left"
        >
            <LogoIcon/>
            <List>
                <ListItem component={Link} to="/">
                    <ListItemIcon>
                        <LockOpenOutlinedIcon/>
                    </ListItemIcon>
                    <ListItemText primary="Wallet" className="sidebar-link"/>
                </ListItem>
                <ListItem component={Link} to="/testaments">
                    <ListItemIcon>
                        <HistoryEduOutlinedIcon/>
                    </ListItemIcon>
                    <ListItemText primary="Testaments" className="sidebar-link"/>
                </ListItem>
                <ListItem component={Link} to="/heirs">
                    <ListItemIcon>
                        <PersonOutlinedIcon/>
                    </ListItemIcon>
                    <ListItemText primary="Heirs" className="sidebar-link"/>
                </ListItem>
                <ListItem component={Link} to="/rules">
                    <ListItemIcon>
                        <SettingsOutlinedIcon/>
                    </ListItemIcon>
                    <ListItemText primary="Rules" className="sidebar-link"/>
                </ListItem>
            </List>
            <Divider/>
            <List>
                <ListItem component={Link} to="/profile">
                    <ListItemIcon>
                        <LockOpenOutlinedIcon/>
                    </ListItemIcon>
                    <ListItemText primary="Profile" className="sidebar-link"/>
                </ListItem>
                <ListItem component={Link} to="/share">
                    <ListItemIcon>
                        <HistoryEduOutlinedIcon/>
                    </ListItemIcon>
                    <ListItemText primary="Share" className="sidebar-link"/>
                </ListItem>
            </List>
            <Divider/>
            <List>
                <ListItem component={Link} to="/" onClick={handleLogout}>
                    <ListItemIcon>
                        <PersonOutlinedIcon/>
                    </ListItemIcon>
                    <ListItemText primary="Logout" className="sidebar-link"/>
                </ListItem>
            </List>
        </Drawer>
    )
}
