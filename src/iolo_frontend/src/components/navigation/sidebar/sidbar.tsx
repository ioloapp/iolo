import {Divider, Drawer, List, ListItem, ListItemIcon, ListItemText} from "@mui/material";
import * as React from "react";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import {Link} from "react-router-dom";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SendIcon from '@mui/icons-material/Send';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import './sidbar.css';
import {userActions} from "../../../redux/user/userSlice";
import {useAppDispatch} from "../../../redux/hooks";
import {sidebarWith} from "../../../App";
import {useTranslation} from "react-i18next";
import {ROUTE_CONTACTS, ROUTE_POLICIES, ROUTE_PROFILE, ROUTE_SECRETS, ROUTE_SHARE} from "../../layout/routes";
import {IoloLogo} from "../../../resources/logo";

export const SideBar = () => {

    const dispatch = useAppDispatch();
    const {t} = useTranslation();

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
            <IoloLogo/>
            <List>
                <ListItem component={Link} to={ROUTE_SECRETS}>
                    <ListItemIcon>
                        <LockOpenOutlinedIcon className="navigation-icon"/>
                    </ListItemIcon>
                    <ListItemText primary={t('secrets.title')} className="sidebar-link"/>
                </ListItem>
                <ListItem component={Link} to={ROUTE_POLICIES}>
                    <ListItemIcon>
                        <HistoryEduOutlinedIcon className="navigation-icon"/>
                    </ListItemIcon>
                    <ListItemText primary={t('policies.title')} className="sidebar-link"/>
                </ListItem>
                <ListItem component={Link} to={ROUTE_CONTACTS}>
                    <ListItemIcon>
                        <PeopleOutlineIcon className="navigation-icon"/>
                    </ListItemIcon>
                    <ListItemText primary={t('contacts.title')} className="sidebar-link"/>
                </ListItem>
            </List>
            <Divider/>
            <List>
                <ListItem component={Link} to={ROUTE_PROFILE}>
                    <ListItemIcon>
                        <PersonOutlinedIcon className="navigation-icon"/>
                    </ListItemIcon>
                    <ListItemText primary={t('profile.title')} className="sidebar-link"/>
                </ListItem>
                <ListItem component={Link} to={ROUTE_SHARE}>
                    <ListItemIcon>
                        <SendIcon className="navigation-icon"/>
                    </ListItemIcon>
                    <ListItemText primary={t('share.title-short')} className="sidebar-link"/>
                </ListItem>
            </List>
            <Divider/>
            <List>
                <ListItem component={Link} to={ROUTE_SECRETS} onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon className="navigation-icon"/>
                    </ListItemIcon>
                    <ListItemText primary={t('logout.button')} className="sidebar-link"/>
                </ListItem>
            </List>
        </Drawer>
    )
}
