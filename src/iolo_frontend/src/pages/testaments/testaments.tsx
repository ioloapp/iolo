import {Avatar, Box, IconButton, List, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import * as React from "react";
import {useEffect, useState} from "react";
import {useAppDispatch} from "../../redux/hooks";
import {PageLayout} from "../../components/layout/page-layout";
import {useSelector} from "react-redux";
import {
    selectTestamentError,
    selectTestaments,
    selectTestamentsListState
} from "../../redux/testaments/testamentsSelectors";
import AddTestamentDialog from "../../components/testament/add-testament-dialog";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import {
    editTestamentThunk,
    loadTestamentsThunk,
    testamentsActions,
    viewTestamentThunk
} from "../../redux/testaments/testamentsSlice";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import {UiTestament, UiTestamentListEntryRole} from "../../services/IoloTypesForUi";
import DeleteTestamentDialog from "../../components/testament/delete-testament-dialog";
import EditTestamentDialog from "../../components/testament/edit-testament-dialog";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {Error} from "../../components/error/error";
import ViewTestamentDialog from "../../components/testament/view-testament-dialog";
import {selectSecretsListState} from "../../redux/secrets/secretsSelectors";
import {loadSecretsThunk} from "../../redux/secrets/secretsSlice";
import {loadHeirsThunk} from "../../redux/heirs/heirsSlice";
import {selectHeirListState} from "../../redux/heirs/heirsSelectors";
import ViewSecretDialog from "../../components/secret/view-secret-dialog";
import {useTranslation} from "react-i18next";

export function Testaments() {

    const dispatch = useAppDispatch();
    const testaments = useSelector(selectTestaments);
    const testamentsListState = useSelector(selectTestamentsListState);
    const testamentsListError = useSelector(selectTestamentError);
    const secretsListState = useSelector(selectSecretsListState);
    const heirsListState = useSelector(selectHeirListState);
    const { t } = useTranslation();

    useEffect(() => {
        if (secretsListState === 'init') {
            dispatch(loadSecretsThunk())
        }
        if (heirsListState === 'init') {
            dispatch(loadHeirsThunk())
        }
        dispatch(loadTestamentsThunk())
    }, [])

    useEffect(() => {
        setFilteredTestaments(testaments)
    }, [testaments])

    const [filteredTestaments, setFilteredTestaments] = useState(testaments)

    const deleteTestament = (testament: UiTestament) => {
        dispatch(testamentsActions.updateDialogItem({id: testament.id, name: testament.name}));
        dispatch(testamentsActions.openDeleteDialog());
    }

    const viewTestament = (testament: UiTestament) => {
        dispatch(viewTestamentThunk(testament));
    }

    const editTestament = (testament: UiTestament) => {
        dispatch(editTestamentThunk(testament));
    }

    const filterTestamentList = (search: string) => {
        const searchString = search.toLowerCase();
        if (searchString.length === 0) {
            setFilteredTestaments(testaments);
        } else {
            setFilteredTestaments(testaments.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0))
        }
    }

    const hasError = (): boolean => {
        return testamentsListState === 'failed';
    }

    return (
        <PageLayout title={t('policies.title')} filterList={filterTestamentList}>
            <>
                <Box>
                    {hasError() &&
                        <Error error={testamentsListError}/>
                    }
                    {!hasError() && filteredTestaments &&
                        <Box>
                            <List dense={false}>
                                {filteredTestaments.flatMap(f => f ? [f] : []).map((testament: UiTestament) =>
                                    <ListItem key={testament.id} secondaryAction={
                                        <>
                                            {
                                                testament.role === UiTestamentListEntryRole.Testator &&
                                                <>
                                                    <IconButton edge="end" aria-label="view"
                                                                onClick={() => viewTestament(testament)}>
                                                        <VisibilityOutlinedIcon/>
                                                    </IconButton>
                                                    <IconButton edge="end" aria-label="edit"
                                                                onClick={() => editTestament(testament)}>
                                                        <EditOutlinedIcon/>
                                                    </IconButton>
                                                    <IconButton edge="end" aria-label="delete"
                                                                onClick={() => deleteTestament(testament)}>
                                                        <DeleteIcon/>
                                                    </IconButton>
                                                </>
                                            }
                                            {
                                                testament.role === UiTestamentListEntryRole.Heir && !testament.conditions.status &&
                                                <LockOutlinedIcon/>
                                            }
                                            {
                                                testament.role === UiTestamentListEntryRole.Heir && testament.conditions.status &&
                                                <IconButton edge="end" aria-label="view"
                                                            onClick={() => viewTestament(testament)}>
                                                    <VisibilityOutlinedIcon/>
                                                </IconButton>
                                            }
                                        </>
                                    }>
                                        <ListItemAvatar>
                                            <Avatar>
                                                <HistoryEduOutlinedIcon/>
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={testament.name}
                                            secondary={testament.role === UiTestamentListEntryRole.Heir ? `${t('policies.beneficiary')}: ${testament.testator.id}` : ''}
                                        />
                                    </ListItem>,
                                )}
                            </List>
                        </Box>
                    }
                </Box>
                <ViewSecretDialog/>
                <AddTestamentDialog/>
                <ViewTestamentDialog/>
                <EditTestamentDialog/>
                <DeleteTestamentDialog/>
            </>
        </PageLayout>
    );
}
