import {styled} from "@mui/material/styles";
import {AppBar, TextField} from "@mui/material";
import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import {useNavigate} from "react-router-dom";
import {userActions} from "../../redux/user/userSlice";
import {useAppDispatch} from "../../redux/hooks";

export const UserProfile = () => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleLogout = () => {
        setAnchorEl(null);
        dispatch(userActions.logOut());
    };

    const handleProfile = () => {
        setAnchorEl(null);
        navigate("/profile")
    };

    const handleShare = () => {
        setAnchorEl(null);
        navigate("/share")
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (

        <div>
            <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
            >
                <AccountCircle/>
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
                <MenuItem onClick={handleShare}>Share</MenuItem>
                <MenuItem onClick={handleProfile}>Profile</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </div>
    );
}

export const StyledAppBar = styled(AppBar)(() => ({
    position: 'fixed',
    top: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: '5px 10px 5px 10px'
}));

export const SearchField = styled(TextField)(() => ({
    width: '100%',
    boxShadow: 'none'
}));
