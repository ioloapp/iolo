import {Avatar, Box, IconButton, List, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import * as React from "react";
import {useEffect, useState} from "react";
import {useAppDispatch} from "../../redux/hooks";
import {PageLayout} from "../../components/layout/page-layout";
import {useSelector} from "react-redux";
import {selectPolicies, selectPoliciesListState, selectPolicyError} from "../../redux/policies/policiesSelectors";
import AddPolicyDialog from "../../components/policies/add-policy-dialog";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import {editPolicyThunk, loadPoliciesThunk, policiesActions, viewPolicyThunk} from "../../redux/policies/policiesSlice";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import {UiPolicy, UiTestamentListEntryRole} from "../../services/IoloTypesForUi";
import DeletePolicyDialog from "../../components/policies/delete-policy-dialog";
import EditPolicyDialog from "../../components/policies/edit-policy-dialog";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {Error} from "../../components/error/error";
import ViewPolicyDialog from "../../components/policies/view-policy-dialog";
import {selectSecretsListState} from "../../redux/secrets/secretsSelectors";
import {loadSecretsThunk} from "../../redux/secrets/secretsSlice";
import {loadContactsThunk} from "../../redux/contacts/contactsSlice";
import {selectContactsListState} from "../../redux/contacts/contactsSelectors";
import ViewSecretDialog from "../../components/secret/view-secret-dialog";
import {useTranslation} from "react-i18next";

export function Policies() {

    const dispatch = useAppDispatch();
    const testaments = useSelector(selectPolicies);
    const testamentsListState = useSelector(selectPoliciesListState);
    const testamentsListError = useSelector(selectPolicyError);
    const secretsListState = useSelector(selectSecretsListState);
    const heirsListState = useSelector(selectContactsListState);
    const { t } = useTranslation();

    useEffect(() => {
        if (secretsListState === 'init') {
            dispatch(loadSecretsThunk())
        }
        if (heirsListState === 'init') {
            dispatch(loadContactsThunk())
        }
        dispatch(loadPoliciesThunk())
    }, [])

    useEffect(() => {
        setFilteredTestaments(testaments)
    }, [testaments])

    const [filteredTestaments, setFilteredTestaments] = useState(testaments)

    const deleteTestament = (testament: UiPolicy) => {
        dispatch(policiesActions.updateDialogItem({id: testament.id, name: testament.name}));
        dispatch(policiesActions.openDeleteDialog());
    }

    const viewTestament = (testament: UiPolicy) => {
        dispatch(viewPolicyThunk(testament));
    }

    const editTestament = (testament: UiPolicy) => {
        dispatch(editPolicyThunk(testament));
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
                                {filteredTestaments.flatMap(f => f ? [f] : []).map((testament: UiPolicy) =>
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
                                                testament.role === UiTestamentListEntryRole.Heir && !testament.conditionsStatus &&
                                                <LockOutlinedIcon/>
                                            }
                                            {
                                                testament.role === UiTestamentListEntryRole.Heir && testament.conditionsStatus &&
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
                <AddPolicyDialog/>
                <ViewPolicyDialog/>
                <EditPolicyDialog/>
                <DeletePolicyDialog/>
            </>
        </PageLayout>
    );
}
