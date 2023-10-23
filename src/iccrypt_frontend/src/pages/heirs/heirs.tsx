import {Avatar, Box, IconButton, List, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import * as React from "react";
import {useEffect, useState} from "react";
import {PageLayout} from "../../components/layout/page-layout";
import {useAppDispatch} from "../../redux/hooks";
import {useSelector} from "react-redux";
import {selectHeirs} from "../../redux/heirs/heirsSelectors";
import {heirsActions, loadHeirsThunk} from "../../redux/heirs/heirsSlice";
import AddHeirDialog from "../../components/heir/add-heir-dialog";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import {UiUser, UiUserType} from "../../services/IcTypesForUi";
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteHeirDialog from "../../components/heir/delete-heir-dialog";
import {SearchField, StyledAppBar} from "../../components/layout/search-bar";
import SearchIcon from "@mui/icons-material/Search";
import EditHeirDialog from "../../components/heir/edit-heir-dialog";

export function Heirs() {

    const dispatch = useAppDispatch();
    const heirs = useSelector(selectHeirs);

    useEffect(() => {
        dispatch(loadHeirsThunk())
    }, [])

    useEffect(() => {
        setFilteredHeirs(heirs)
    }, [heirs])

    const [filteredHeirs, setFilteredHeirs] = useState(heirs)
    const deleteHeir = (heir: UiUser) => {
        dispatch(heirsActions.updateHeirToAdd(heir));
        dispatch(heirsActions.openDeleteDialog());
    }

    const editHeir = (heir: UiUser) => {
        dispatch(heirsActions.updateHeirToAdd(heir));
        dispatch(heirsActions.openEditDialog());
    }

    const filterHeirsList = (search: string) => {
        const searchString = search.toLowerCase();
        if(searchString.length === 0){
            setFilteredHeirs(heirs);
        }else {
            setFilteredHeirs(heirs.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0 || s.email.toLowerCase().indexOf(searchString) >= 0))
        }
    }

    return (
        <PageLayout title="Heirs">
            <StyledAppBar position="sticky">
                <SearchField id="outlined-basic" sx={{boxShadow: 'none'}} onChange={(e) => filterHeirsList(e.target.value)}/>
                <IconButton size="large" aria-label="search" color="inherit">
                    <SearchIcon/>
                </IconButton>
            </StyledAppBar>
            <Box>
                {filteredHeirs &&
                    <Box>
                        <List dense={false}>
                            {filteredHeirs.map((heir: UiUser) =>
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
                                    {heir.type === UiUserType.Person &&
                                            <>
                                                <ListItemAvatar>
                                                <Avatar>
                                                    <PersonOutlinedIcon/>
                                                </Avatar>
                                            </ListItemAvatar>

                                            <ListItemText
                                                primary={`${heir.name}`}
                                                secondary={heir.email}
                                            />
                                        </>
                                    }
                                    {heir.type === UiUserType.Company &&
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
            <AddHeirDialog />
            <EditHeirDialog />
            <DeleteHeirDialog />
        </PageLayout>
    )
}
