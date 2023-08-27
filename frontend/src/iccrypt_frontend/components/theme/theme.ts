import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#FFB267',
        },
        secondary: {
            main: '#853219',
        },
        error: {
            main: '#f44336',
        },
        background: {
            default: '#333131',
        },
    },
});

export default theme;
