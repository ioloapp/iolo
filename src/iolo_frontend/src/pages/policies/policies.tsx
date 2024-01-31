import {Avatar, Box, IconButton, List, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import * as React from "react";
import {useEffect, useState} from "react";
import {useAppDispatch} from "../../redux/hooks";
import {PageLayout} from "../../components/layout/page-layout";
import {useSelector} from "react-redux";
import {selectPolicies, selectPolicyError, selectPolicyListState} from "../../redux/policies/policiesSelectors";
import AddPolicyDialog from "../../components/policies/add-policy-dialog";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import {editPolicyThunk, loadPoliciesThunk, policiesActions, viewPolicyThunk} from "../../redux/policies/policiesSlice";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import {UiPolicy, UiPolicyListEntryRole} from "../../services/IoloTypesForUi";
import DeletePolicyDialog from "../../components/policies/delete-policy-dialog";
import EditPolicyDialog from "../../components/policies/edit-policy-dialog";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {Error} from "../../components/error/error";
import ViewPolicyDialog from "../../components/policies/view-policy-dialog";
import {selectSecretListState} from "../../redux/secrets/secretsSelectors";
import {loadSecretsThunk} from "../../redux/secrets/secretsSlice";
import {loadContactsThunk} from "../../redux/contacts/contactsSlice";
import {selectContactListState} from "../../redux/contacts/contactsSelectors";
import ViewSecretDialog from "../../components/secret/view-secret-dialog";
import {useTranslation} from "react-i18next";

export function Policies() {

    const dispatch = useAppDispatch();
    const policies = useSelector(selectPolicies);
    const policyListState = useSelector(selectPolicyListState);
    const policyListError = useSelector(selectPolicyError);
    const secretListState = useSelector(selectSecretListState);
    const contactListState = useSelector(selectContactListState);
    const { t } = useTranslation();

    useEffect(() => {
        if (secretListState === 'init') {
            dispatch(loadSecretsThunk())
        }
        if (contactListState === 'init') {
            dispatch(loadContactsThunk())
        }
        dispatch(loadPoliciesThunk())
    }, [])

    useEffect(() => {
        setFilteredPolicies(policies)
    }, [policies])

    const [filteredPolicies, setFilteredPolicies] = useState(policies)

    const deletePolicy = (uiPolicy: UiPolicy) => {
        dispatch(policiesActions.updateDialogItem({id: uiPolicy.id, name: uiPolicy.name}));
        dispatch(policiesActions.openDeleteDialog());
    }

    const viewPolicy = (uiPolicy: UiPolicy) => {
        dispatch(viewPolicyThunk(uiPolicy));
    }

    const editPolicy = (uiPolicy: UiPolicy) => {
        dispatch(editPolicyThunk(uiPolicy));
    }

    const filterPolicyList = (search: string) => {
        const searchString = search.toLowerCase();
        if (searchString.length === 0) {
            setFilteredPolicies(policies);
        } else {
            setFilteredPolicies(policies.filter(s => s.name.toLowerCase().indexOf(searchString) >= 0))
        }
    }

    const hasError = (): boolean => {
        return policyListState === 'failed';
    }

    return (
        <PageLayout title={t('policies.title')} filterList={filterPolicyList}>
            <>
                <Box>
                    {hasError() &&
                        <Error error={policyListError}/>
                    }
                    {!hasError() && filteredPolicies &&
                        <Box>
                            <List dense={false}>
                                {filteredPolicies.flatMap(f => f ? [f] : []).map((policy: UiPolicy) =>
                                    <ListItem key={policy.id} secondaryAction={
                                        <>
                                            {
                                                policy.role === UiPolicyListEntryRole.Owner &&
                                                <>
                                                    <IconButton edge="end" aria-label="view"
                                                                onClick={() => viewPolicy(policy)}>
                                                        <VisibilityOutlinedIcon/>
                                                    </IconButton>
                                                    <IconButton edge="end" aria-label="edit"
                                                                onClick={() => editPolicy(policy)}>
                                                        <EditOutlinedIcon/>
                                                    </IconButton>
                                                    <IconButton edge="end" aria-label="delete"
                                                                onClick={() => deletePolicy(policy)}>
                                                        <DeleteIcon/>
                                                    </IconButton>
                                                </>
                                            }
                                            {
                                                policy.role === UiPolicyListEntryRole.Beneficiary && !policy.conditionsStatus &&
                                                <LockOutlinedIcon/>
                                            }
                                            {
                                                policy.role === UiPolicyListEntryRole.Beneficiary && policy.conditionsStatus &&
                                                <IconButton edge="end" aria-label="view"
                                                            onClick={() => viewPolicy(policy)}>
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
                                            primary={policy.name}
                                            secondary={policy.role === UiPolicyListEntryRole.Beneficiary ? `${t('policies.beneficiary')}: ${policy.owner?.id}` : ''}
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
