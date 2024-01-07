import {PaletteMode} from "@mui/material";

export const getBaseTheme = (mode: PaletteMode) => ({
    palette: {
        mode,
        ...(mode === 'light' ?
            {
                primary: {
                    main: '#3b3b3b',
                },
                secondary: {
                    main: '#fa9e02',
                },
                error: {
                    main: '#F5B542',
                },
                background: {
                    default: '#FFFFFF',
                }
            }
            : {
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
                    default: '#3b3b3b',
                },
            })
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: '#1C5264',
                    color: '#FFFFFF'
                }
            },
        },
        MuiFab: {
            styleOverrides: {
                root: {
                    background: '#F5B542',
                    color: '#3b3b3b'
                }
            },
        },
        MuiBottomNavigation: {
            styleOverrides: {
                root: {
                    background: '#1C5264',
                    color: '#FFFFFF'
                }
            },
        },
        MuiBottomNavigationAction: {
            styleOverrides: {
                root: {
                    color: '#FFFFFF'
                }
            },
        }
    }
});
