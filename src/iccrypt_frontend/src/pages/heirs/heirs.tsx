import {Avatar, Box, IconButton, List, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import * as React from "react";
import {useEffect} from "react";
import {PageLayout} from "../../components/layout/page-layout";
import {useAppDispatch} from "../../redux/hooks";
import {useSelector} from "react-redux";
import {selectHeirs} from "../../redux/heirs/heirsSelectors";
import {heirsActions, loadHeirsThunk} from "../../redux/heirs/heirsSlice";
import AddEditHeirDialog from "../../components/heir/add-edit-heir-dialog";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import {UiUser, UserType} from "../../services/IcTypesForUi";
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteHeirDialog from "../../components/heir/delete-heir-dialog";

export function Heirs() {

    const dispatch = useAppDispatch();
    const heirs = useSelector(selectHeirs);
    //TODO const sortedHeirs = heirs.sort((a,b) => a.type === b.type ? 0 : -1)

    useEffect(() => {
        dispatch(loadHeirsThunk())
    }, [])

    const deleteHeir = (heir: UiUser) => {
        dispatch(heirsActions.updateHeirToAdd(heir));
        dispatch(heirsActions.openDeleteDialog());
    }

    const editHeir = (heir: UiUser) => {
        dispatch(heirsActions.updateHeirToAdd(heir));
        dispatch(heirsActions.openEditDialog());
    }

    return (
        <PageLayout title="Heirs">
            <Box>
                {heirs &&
                    <Box>
                        <List dense={false}>
                            {heirs.map((heir: UiUser) =>
                                <ListItem key={heir.id} secondaryAction={
                                    <>
                                        <IconButton edge="end" aria-label="delete" onClick={() => editHeir(heir)}>
                                            <EditOutlinedIcon/>
                                        </IconButton>
                                        <IconButton edge="end" aria-label="delete" onClick={() => deleteHeir(heir)}>
                                            <DeleteIcon/>
                                        </IconButton>
                                    </>
                                }>
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
            <AddEditHeirDialog/>
            <DeleteHeirDialog />
        </PageLayout>
    )
}
