import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import AppBottomNavigation from '../navigation/bottom/bottom-navigation';
import {Secrets} from '../../pages/vault/secrets';
import {Policies} from '../../pages/policies/policies';
import {Contacts} from '../../pages/contacts/contacts';
import {Login} from '../../pages/login/login';
import * as React from 'react';
import {FC} from 'react';
import {Onboarding} from '../../pages/onboarding/onboarding';
import {selectIsUserExisting, selectPrincipal,} from "../../redux/user/userSelectors";
import {useSelector} from "react-redux";
import {Profile} from "../../pages/profile/profile";
import {ShareId} from "../../pages/share/share";
import {SideBar} from "../navigation/sidebar/sidbar";
import {Box} from "@mui/material";
import {mobileWidth} from "../../App";
import useWindowResize from "../../utils/useWindowResize";
import {ROUTE_CONTACTS, ROUTE_POLICIES, ROUTE_PROFILE, ROUTE_SECRETS, ROUTE_SHARE} from "./routes";

export const Layout: FC = () => {
    const isLoggedIn = useSelector(selectPrincipal);
    const isAccountExisting = useSelector(selectIsUserExisting);
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
                        <Route path={ROUTE_POLICIES} Component={Policies}/>
                        <Route path={ROUTE_CONTACTS} Component={Contacts}/>
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
