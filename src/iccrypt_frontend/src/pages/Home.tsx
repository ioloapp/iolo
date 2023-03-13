import * as React from 'react';

// Redux
import { useAppSelector, useAppDispatch } from '../redux/hooks'; // for typescript
import { hasAccount } from '../redux/userSlice';

// MUI
import {
    Box, Typography, Backdrop, Button, CircularProgress
} from '@mui/material';

// IC
import { getActor } from '../utils/backend';


const Home = () => {

    const dispatch = useAppDispatch();
    const isLoggedIn = useAppSelector((state) => state.user.isLoggedIn);
    const principal = useAppSelector((state) => state.user.principal);
    const isAccountExisting = useAppSelector((state) => state.user.hasAccount);

    const [loadingIconIsOpen, setLoadingIcon] = React.useState(false);

    async function createUser() {
        setLoadingIcon(true);
        let actor = await getActor();
        await actor.create_user();
        dispatch(hasAccount(true));
        setLoadingIcon(false);
    }

    return (
        <Box >
            <Typography variant="h3" paragraph>
                Welcome to IC Crypt
            </Typography>
            {isLoggedIn &&
                <Box>
                    <Typography paragraph>
                        Your principal is: {principal}
                    </Typography>
                    {!isAccountExisting &&
                        <Box justifyContent="center">
                            <Typography paragraph>
                                It seems you have not yet created your IC Crypt account. You wanna go for one?
                            </Typography>
                            <Button variant="contained" sx={{ ml: 2, mt: 1 }} onClick={() => {
                                createUser();
                            }}>
                                Create Account
                            </Button>
                            <Backdrop
                                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                                open={loadingIconIsOpen}
                            >
                                <CircularProgress color="inherit" />
                            </Backdrop>
                        </Box>

                    }
                    {isAccountExisting &&
                        <Box justifyContent="center">
                            <Typography paragraph>
                                Congrats! You have already an account!
                            </Typography>
                        </Box>
                    }
                </Box>
            }
            {!isLoggedIn &&
                <Typography paragraph>
                    Please login to discover the beautiful world of IC Crypt...
                </Typography>
            }

        </Box>
    );
};

export default Home;






