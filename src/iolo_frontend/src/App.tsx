import {CssBaseline, ThemeProvider} from '@mui/material';
import {getBaseTheme} from './components/theme/theme';
import {Layout} from './components/layout/layout';
import './App.css';
import * as React from 'react';
import {useSelector} from "react-redux";
import {selectMode, selectPrincipal} from "./redux/user/userSelectors";
import {createTheme} from "@mui/material/styles";

export const mobileWidth = 600;

export const sidebarWith = 240;

function App() {

    const mode = useSelector(selectMode)
    const theme = React.useMemo(() => {
        return createTheme(getBaseTheme(mode));
    }, [mode]);

    const isLoggedIn = useSelector(selectPrincipal);

    const getBackground = (): string => {
        if(isLoggedIn){
            return theme.palette.background.default;
        }
        return "#1C5264";
    }

    return (
        <ThemeProvider theme={theme}>
            <div style={{ backgroundColor: getBackground() }}>
                <CssBaseline/>
                <Layout/>
            </div>
        </ThemeProvider>
    );
}

export default App;
