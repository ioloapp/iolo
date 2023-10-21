import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import AppBottomNavigation from '../navigation/bottom/bottom-navigation';
import {Secrets} from '../../pages/secrets/secrets';
import {Testaments} from '../../pages/testaments/testaments';
import {Heirs} from '../../pages/heirs/heirs';
import {Settings} from '../../pages/settings/settings';
import {Login} from '../../pages/login/login';
import * as React from 'react';
import {Onboarding} from '../../pages/onboarding/onboarding';
import {
    selectUserAccountExistingForCurrentUser,
    selectUserLoggedIn
} from "../../redux/user/userSelectors";

function Layout() {
    const isLoggedIn = selectUserLoggedIn();
    const isAccountExisting = selectUserAccountExistingForCurrentUser();

    if (!isLoggedIn) {
        return <Login/>
    }

    if (!isAccountExisting) {
        return <Onboarding/>
    }

    return (
        <Router>
            <Routes>
                <Route path="/" Component={Secrets}/>
                <Route path="/testaments" Component={Testaments}/>
                <Route path="/heirs" Component={Heirs}/>
                <Route path="/settings" Component={Settings}/>
            </Routes>
            <AppBottomNavigation/>
        </Router>
    );
}

export default Layout;
