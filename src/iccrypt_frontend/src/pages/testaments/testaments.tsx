import {Avatar, Box, IconButton, List, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import * as React from "react";
import {useEffect, useState} from "react";
import {useAppDispatch} from "../../redux/hooks";
import {PageLayout} from "../../components/layout/page-layout";
import {useSelector} from "react-redux";
import {selectTestaments} from "../../redux/testaments/testamentsSelectors";
import AddTestamentDialog from "../../components/testament/add-testament-dialog";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import {editTestamentThunk, loadTestamentsThunk, testamentsActions} from "../../redux/testaments/testamentsSlice";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import {UiTestament} from "../../services/IcTypesForUi";
import DeleteTestamentDialog from "../../components/testament/delete-testament-dialog";
import {SearchField, StyledAppBar} from "../../components/layout/search-bar";
import SearchIcon from "@mui/icons-material/Search";
import EditTestamentDialog from "../../components/testament/edit-testament-dialog";

export function Testaments() {

    const dispatch = useAppDispatch();
    const testaments = useSelector(selectTestaments);

    useEffect(() => {
        dispatch(loadTestamentsThunk())
    }, [])

    useEffect(() => {
        setFilteredTestaments(testaments)
    }, [testaments])

    const [filteredTestaments, setFilteredTestaments] = useState(testaments)

    const deleteTestament = (testament: UiTestament) => {
        dispatch(testamentsActions.updateDialogItem(testament));
        dispatch(testamentsActions.openDeleteDialog());
    }

    const editTestament = (testament: UiTestament) => {
        dispatch(editTestamentThunk(testament.id));
    }

    const filterTestamentList = (search: string) => {
        const searchString = search.toLowerCase();
        if (searchString.length === 0) {
            setFilteredTestaments(testaments);
        } else {
            setFilteredTestaments(testaments.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0))
        }
    }

    return (
        <PageLayout title="Testaments">
            <StyledAppBar position="sticky">
                <SearchField id="outlined-basic" sx={{boxShadow: 'none'}}
                             onChange={(e) => filterTestamentList(e.target.value)}/>
                <IconButton size="large" aria-label="search" color="inherit">
                    <SearchIcon/>
                </IconButton>
            </StyledAppBar>
            <Box>
                {filteredTestaments &&
                    <Box>
                        <List dense={false}>
                            {filteredTestaments.flatMap(f => f ? [f] : []).map((testament: UiTestament) =>
                                <ListItem key={testament.id} secondaryAction={
                                    <>
                                        <IconButton edge="end" aria-label="delete"
                                                    onClick={() => editTestament(testament)}>
                                            <EditOutlinedIcon/>
                                        </IconButton>
                                        <IconButton edge="end" aria-label="delete"
                                                    onClick={() => deleteTestament(testament)}>
                                            <DeleteIcon/>
                                        </IconButton>
                                    </>
                                }>
                                    <ListItemAvatar>
                                        <Avatar>
                                            <HistoryEduOutlinedIcon/>
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={testament.name}
                                    />
                                </ListItem>,
                            )}
                        </List>
                    </Box>
                }
            </Box>
            <AddTestamentDialog/>
            <EditTestamentDialog/>
            <DeleteTestamentDialog/>
        </PageLayout>
    );
}
