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
                default: '#1C5264',
            },
        })
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    ...(mode === 'light' ? {
                        background: '#1C5264',
                        color: '#FFFFFF'
                    } : {
                        background: '#3b3b3b',
                    }),
                }
            },
        },
        MuiBottomNavigation: {
            styleOverrides: {
                root: {
                    ...(mode === 'light' ? {
                        background: '#1C5264',
                        color: '#FFFFFF'
                    } : {
                        background: '#3b3b3b',
                    }),
                }
            },
        },
        MuiBottomNavigationAction: {
            styleOverrides: {
                root: {
                    ...(mode === 'light' ? {
                        color: '#FFFFFF'
                    } : {
                        background: '#3b3b3b',
                    }),
                }
            },
        }
    }
});
