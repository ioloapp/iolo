import {BottomNavigation, BottomNavigationAction} from '@mui/material';
import {Link, useLocation} from 'react-router-dom';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import * as React from 'react';
import {useTranslation} from "react-i18next";
import {ROUTE_HEIRS, ROUTE_RULES, ROUTE_SECRETS, ROUTE_TESTAMENTS} from "../../layout/routes";


function AppBottomNavigation() {
    const location = useLocation();
    const { t } = useTranslation();

    return (
        <BottomNavigation showLabels value={location.pathname} sx={{ position: 'fixed', bottom: 0, width: 1.0 }}>
            <BottomNavigationAction label={t('secrets.title')} icon={<LockOpenOutlinedIcon/>} component={Link} to={ROUTE_SECRETS} value={ROUTE_SECRETS}/>
            <BottomNavigationAction label={t('testaments.title')} icon={<HistoryEduOutlinedIcon/>} component={Link} to={ROUTE_TESTAMENTS} value={ROUTE_TESTAMENTS} />
            <BottomNavigationAction label={t('heirs.title')} icon={<PersonOutlinedIcon/>} component={Link} to={ROUTE_HEIRS} value={ROUTE_HEIRS}/>
            <BottomNavigationAction label={t('rules.title')} icon={<SettingsOutlinedIcon/>} component={Link} to={ROUTE_RULES} value={ROUTE_RULES}/>
        </BottomNavigation>
    );
}

export default AppBottomNavigation;
