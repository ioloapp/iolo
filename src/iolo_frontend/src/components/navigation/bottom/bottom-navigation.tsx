import {BottomNavigation, BottomNavigationAction} from '@mui/material';
import {Link, useLocation} from 'react-router-dom';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import * as React from 'react';
import {useTranslation} from "react-i18next";


function AppBottomNavigation() {
    const location = useLocation();
    const { t } = useTranslation();

    return (
        <BottomNavigation showLabels value={location.pathname} sx={{ position: 'fixed', bottom: 0, width: 1.0 }}>
            <BottomNavigationAction label={t('secrets.title')} icon={<LockOpenOutlinedIcon/>} component={Link} to="/" value="/"/>
            <BottomNavigationAction label={t('testaments.title')} icon={<HistoryEduOutlinedIcon/>} component={Link} to="/testaments" value="/testaments" />
            <BottomNavigationAction label={t('heirs.title')} icon={<PersonOutlinedIcon/>} component={Link} to="/heirs" value="/heirs"/>
            <BottomNavigationAction label={t('rules.title')} icon={<SettingsOutlinedIcon/>} component={Link} to="/rules" value="/rules"/>
        </BottomNavigation>
    );
}

export default AppBottomNavigation;
