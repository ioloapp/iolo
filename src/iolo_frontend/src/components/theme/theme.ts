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
    typography: {
        h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1.2,
            color: '#333',
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#444',
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 400, // Normal
            lineHeight: 1.3,
            color: '#555',
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 400,
            lineHeight: 1.3,
            color: '#666',
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 400,
            lineHeight: 1.3,
            color: '#777',
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 400,
            lineHeight: 1.3,
            color: '#888',
        },
        subtitle1: {
            fontSize: '0.875rem',
            fontWeight: 400,
            lineHeight: 1.4,
            color: 'rgba(0, 0, 0, 0.87)',
        },
        body1: {
            fontSize: '1rem',
            fontWeight: 400,
            lineHeight: 1.5,
            color: 'rgba(0, 0, 0, 0.87)',
        },
        body2: {
            fontSize: '12px',
            fontWeight: 400,
            lineHeight: 1.43,
            color: 'rgba(0, 0, 0, 0.6)',
        },
        test: {

        }
    },
    components: {
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    fontSize: '22px',
                    fontWeight: 400,
                    lineHeight: 1.43,
                    color: 'rgba(0, 0, 0, 0.6)',
                }
            },
        },
        MuiInputBase: {
            styleOverrides: {
                root: {
                    fontSize: '16px',
                    fontWeight: 400,
                    height: '36px',
                    color: 'rgba(0, 0, 0, 0.6)',
                },
                multiline: {
                    height: 'auto'
                }
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    marginBottom: "20px"
                }
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    backgroundColor: "#CACACA"
                }
            }
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&.condition-even': {
                        backgroundColor: "white",
                    },
                    '&.condition-odd': {
                        backgroundColor: "#EEE",
                    },
                }
            }
        },
        MuiToggleButton: {
            styleOverrides: {
                root: {
                    "&.Mui-selected": {
                        borderColor: "#1C5264",
                        borderWidth: "1px solid"
                    }
                }
            }
        },
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
        MuiDrawer: {
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
        },
        MuiOutlinedInput: {
            styleOverrides: {
                input: {
                    padding: '10px'
                }
            }
        }
    }
});
