import {BottomNavigation, BottomNavigationAction} from '@mui/material';
import {Link, useLocation} from 'react-router-dom';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import * as React from 'react';
import {useTranslation} from "react-i18next";
import {ROUTE_HEIRS, ROUTE_SECRETS, ROUTE_TESTAMENTS} from "../../layout/routes";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";


function AppBottomNavigation() {
    const location = useLocation();
    const {t} = useTranslation();

    return (
        <BottomNavigation showLabels value={location.pathname} sx={{position: 'fixed', bottom: 0, width: 1.0}}>
            <BottomNavigationAction label={t('secrets.title')} icon={<LockOpenOutlinedIcon/>} component={Link}
                                    to={ROUTE_SECRETS} value={ROUTE_SECRETS}/>
            <BottomNavigationAction label={t('testaments.title')} icon={<HistoryEduOutlinedIcon/>} component={Link}
                                    to={ROUTE_TESTAMENTS} value={ROUTE_TESTAMENTS}/>
            <BottomNavigationAction label={t('heirs.title')} icon={<PeopleOutlineIcon/>} component={Link}
                                    to={ROUTE_HEIRS} value={ROUTE_HEIRS}/>
        </BottomNavigation>
    );
}

export default AppBottomNavigation;
