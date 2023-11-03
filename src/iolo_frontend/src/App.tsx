import {CssBaseline, ThemeProvider} from '@mui/material';
import theme from './components/theme/theme';
import {Layout} from './components/layout/layout';
import './App.css';
import * as React from 'react';

function App() {

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <Layout/>
        </ThemeProvider>
    );
}

export default App;
