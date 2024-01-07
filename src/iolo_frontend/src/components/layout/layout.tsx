import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import AppBottomNavigation from '../navigation/bottom/bottom-navigation';
import {Secrets} from '../../pages/secrets/secrets';
import {Testaments} from '../../pages/testaments/testaments';
import {Heirs} from '../../pages/heirs/heirs';
import {Rules} from '../../pages/rules/rules';
import {Login} from '../../pages/login/login';
import * as React from 'react';
import {FC} from 'react';
import {Onboarding} from '../../pages/onboarding/onboarding';
import {selectPrincipal, selectUserAccountExistingForCurrentUser,} from "../../redux/user/userSelectors";
import {useSelector} from "react-redux";
import {Profile} from "../../pages/profile/profile";
import {ShareId} from "../../pages/share/share";
import {SideBar} from "../navigation/sidebar/sidbar";
import {Box} from "@mui/material";
import {mobileWidth} from "../../App";
import useWindowResize from "../../utils/useWindowResize";

export const Layout: FC = () => {
    const isLoggedIn = useSelector(selectPrincipal);
    const isAccountExisting = useSelector(selectUserAccountExistingForCurrentUser);
    const {width} = useWindowResize();

    if (!isLoggedIn) {
        return <Login/>
    }

    if (!isAccountExisting) {
        return <Onboarding/>
    }
    console.log(width)

    return (
        <Router>
            <Box sx={{display: 'flex'}}>
                {width >= mobileWidth &&
                    <SideBar/>
                }
                <Box
                    component="main"
                    sx={{flexGrow: 1, bgcolor: 'background.default', p: 3}}
                >
                    <Routes>
                        <Route path="/" Component={Secrets}/>
                        <Route path="/testaments" Component={Testaments}/>
                        <Route path="/heirs" Component={Heirs}/>
                        <Route path="/rules" Component={Rules}/>
                        <Route path="/profile" Component={Profile}/>
                        <Route path="/share" Component={ShareId}/>
                    </Routes>
                </Box>
                {width < mobileWidth &&
                    <AppBottomNavigation/>
                }
            </Box>
        </Router>
    );
}
