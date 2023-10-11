import {Avatar, Box, List, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import * as React from "react";
import {useEffect} from "react";
import {PageLayout} from "../../components/layout/page-layout";
import {useAppDispatch} from "../../redux/hooks";
import {useSelector} from "react-redux";
import {selectHeirs} from "../../redux/heirs/heirsSelectors";
import {loadHeirsThunk} from "../../redux/heirs/heirsSlice";
import AddHeirDialog from "../../components/heir/add-heir-dialog";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import {UserType} from "../../services/IcTypesForUi";
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';

export function Heirs() {

    const dispatch = useAppDispatch();
    const heirs = useSelector(selectHeirs);
    //TODO const sortedHeirs = heirs.sort((a,b) => a.type === b.type ? 0 : -1)

    useEffect(() => {
        dispatch(loadHeirsThunk())
    }, [])

    return (
        <PageLayout title="Heirs">
            <Box>
                {heirs &&
                    <Box>
                        <List dense={false}>
                            {heirs.map(heir =>
                                <ListItem key={heir.id}>
                                    {heir.type === UserType.Person &&
                                            <>
                                                <ListItemAvatar>
                                                <Avatar>
                                                    <PersonOutlinedIcon/>
                                                </Avatar>
                                            </ListItemAvatar>

                                            <ListItemText
                                                primary={`${heir.firstname} ${heir.name}`}
                                                secondary={heir.email}
                                            />
                                        </>
                                    }
                                    {heir.type === UserType.Company &&
                                        <>
                                            <ListItemAvatar>
                                                <Avatar>
                                                    <ApartmentOutlinedIcon/>
                                                </Avatar>
                                            </ListItemAvatar>

                                            <ListItemText
                                                primary={heir.name}
                                                secondary={heir.email}
                                            />
                                        </>
                                    }
                                </ListItem>,
                            )}
                        </List>
                    </Box>
                }
            </Box>
            <AddHeirDialog/>
        </PageLayout>
    )
}
