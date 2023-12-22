import {createTheme} from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#FFFFFF',
        },
        secondary: {
            main: '#F5E538',
        },
        error: {
            main: '#F5B542',
        },
        background: {
            default: '#1C5264',
        },
    },
});

export default theme;
