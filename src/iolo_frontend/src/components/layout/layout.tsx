import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import AppBottomNavigation from '../navigation/bottom/bottom-navigation';
import {Secrets} from '../../pages/secrets/secrets';
import {Testaments} from '../../pages/testaments/testaments';
import {Heirs} from '../../pages/heirs/heirs';
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
import {ROUTE_HEIRS, ROUTE_PROFILE, ROUTE_SECRETS, ROUTE_SHARE, ROUTE_TESTAMENTS} from "./routes";

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
                        <Route path={ROUTE_SECRETS} Component={Secrets}/>
                        <Route path={ROUTE_TESTAMENTS} Component={Testaments}/>
                        <Route path={ROUTE_HEIRS} Component={Heirs}/>
                        <Route path={ROUTE_PROFILE} Component={Profile}/>
                        <Route path={ROUTE_SHARE} Component={ShareId}/>
                    </Routes>
                </Box>
                {width < mobileWidth &&
                    <AppBottomNavigation/>
                }
            </Box>
        </Router>
    );
}
