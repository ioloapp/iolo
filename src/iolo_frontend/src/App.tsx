import {CssBaseline, ThemeProvider} from '@mui/material';
import {getBaseTheme} from './components/theme/theme';
import {Layout} from './components/layout/layout';
import './App.css';
import * as React from 'react';
import {useSelector} from "react-redux";
import {selectMode} from "./redux/user/userSelectors";
import {createTheme} from "@mui/material/styles";

function App() {

    const mode = useSelector(selectMode)
    const theme = React.useMemo(() => {
        return createTheme(getBaseTheme(mode));
    }, [mode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <Layout/>
        </ThemeProvider>
    );
}

export default App;
