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

export function Heirs() {

    const dispatch = useAppDispatch();
    const heirs = useSelector(selectHeirs);

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
                                    <ListItemAvatar>
                                        <Avatar>
                                            <PersonOutlinedIcon/>
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={heir.name}
                                    />
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
