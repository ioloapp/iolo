import {Box, IconButton, Typography} from "@mui/material";
import * as React from "react";
import {FC, ReactElement} from "react";
import {mobileWidth, sidebarWith} from "../../App";
import {LogoIcon, SearchField, StyledAppBar, UserProfile} from "./search-bar";
import SearchIcon from "@mui/icons-material/Search";
import useWindowResize from "../../utils/useWindowResize";

export interface PageLayoutProps {
    title: string
    children: ReactElement,
    filterList?: (value: string) => void;
    showAppBar?: boolean;
}

export const PageLayout: FC<PageLayoutProps> = ({title, children, filterList, showAppBar = true}: PageLayoutProps) => {

    const {width} = useWindowResize();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: showAppBar ? 'calc(100vh - 140px)' : '100vh',
                mt: showAppBar ? '70px' : '0px',
                mb: showAppBar ? '70px' : '0px',
            }}
        >
            {showAppBar &&
                <StyledAppBar position="sticky" sx={{
                    width: width >= mobileWidth ? width - sidebarWith : '100%',
                    minHeight: '56px'
                }}>
                    {width < mobileWidth &&
                        <LogoIcon/>
                    }
                    {filterList &&
                        <>
                            <SearchField id="outlined-basic" sx={{boxShadow: 'none'}}
                                         onChange={(e) => filterList(e.target.value)}/>
                            <IconButton size="large" aria-label="search" color="inherit" sx={{marginRight: '20px'}}>
                                <SearchIcon/>
                            </IconButton>
                        </>
                    }
                    {width < mobileWidth &&
                        <UserProfile/>
                    }
                </StyledAppBar>
            }
            <Box
                sx={{
                    padding: 2,
                    textAlign: 'center',
                }}
            >
                <Typography variant="h4">{title}</Typography>
            </Box>

            <Box sx={{
                padding: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Box sx={{width: '100%', maxWidth: '650px'}}>
                    {children}
                </Box>

            </Box>
        </Box>
    )
}
