import {AppBar, IconButton, TextField} from '@mui/material';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import AppBottomNavigation from '../navigation/bottom/bottom-navigation';
import SearchIcon from '@mui/icons-material/Search';
import {styled} from '@mui/material/styles';
import {Wallets} from '../../pages/wallets/wallets';
import {Testaments} from '../../pages/testaments/testaments';
import {Heires} from '../../pages/heires/heires';
import { Settings } from '../../pages/settings/settings';


function Layout() {

    const StyledAppBar = styled(AppBar)(() => ({
        position: 'fixed',
        top: 0,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: '5px 10px 5px 10px'
    }));

    const SearchField = styled(TextField)(() => ({
        width: '100%'
    }));

    return (
        <Router>
            <StyledAppBar position="sticky">
                <SearchField id="outlined-basic" variant="outlined" />
                <IconButton size="large" aria-label="search" color="inherit">
                    <SearchIcon />
                </IconButton>
            </StyledAppBar>
            <Routes>
                <Route path="/" Component={Wallets}/>
                <Route path="/testaments" Component={Testaments}/>
                <Route path="/heires" Component={Heires}/>
                <Route path="/settings" Component={Settings}/>
            </Routes>
            <AppBottomNavigation/>
        </Router>
    );
}

export default Layout;
