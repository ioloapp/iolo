import {AppBar, IconButton, TextField} from '@mui/material';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import AppBottomNavigation from '../navigation/bottom/bottom-navigation';
import SearchIcon from '@mui/icons-material/Search';
import {styled} from '@mui/material/styles';
import {Wallet} from '../../pages/wallet/wallet';
import {Testaments} from '../../pages/testaments/testaments';
import {Heires} from '../../pages/heires/heires';
import {Settings} from '../../pages/settings/settings';
import {Login} from '../../pages/login/login';
import * as React from 'react';
import {Onboarding} from '../../pages/onboarding/onboarding';
import {selectUserAccountExisting, selectUserLoggedIn} from "../../redux/user/userSelectors";

function Layout() {

    const isLoggedIn = selectUserLoggedIn();
    const isAccountExisting = selectUserAccountExisting();

    const StyledAppBar = styled(AppBar)(() => ({
        position: 'fixed',
        top: 0,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: '5px 10px 5px 10px'
    }));

    const SearchField = styled(TextField)(() => ({
        width: '100%',
        boxShadow: 'none'
    }));

    if (!isLoggedIn) {
        return <Login/>
    }

    if (!isAccountExisting) {
        return <Onboarding/>
    }

    return (
        <Router>
            <StyledAppBar position="sticky">
                <SearchField id="outlined-basic" sx={{boxShadow: 'none'}}/>
                <IconButton size="large" aria-label="search" color="inherit">
                    <SearchIcon/>
                </IconButton>
            </StyledAppBar>
            <Routes>
                <Route path="/" Component={Wallet}/>
                <Route path="/testaments" Component={Testaments}/>
                <Route path="/heires" Component={Heires}/>
                <Route path="/settings" Component={Settings}/>
            </Routes>
            <AppBottomNavigation/>
        </Router>
    );
}

export default Layout;
