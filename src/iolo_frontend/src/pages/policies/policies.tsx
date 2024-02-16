import {Box, List, Typography} from "@mui/material";
import * as React from "react";
import {useEffect, useState} from "react";
import {useAppDispatch} from "../../redux/hooks";
import {PageLayout} from "../../components/layout/page-layout";
import {useSelector} from "react-redux";
import {
    selectBeneficiaryPolicies,
    selectPolicies,
    selectPolicyError,
    selectPolicyListState,
    selectValidatorPolicies
} from "../../redux/policies/policiesSelectors";
import AddPolicyDialog from "../../components/policies/add-policy-dialog";
import {
    loadPoliciesThunk,
    loadPoliciesWhereUserIsBeneficiaryThunk,
    loadPoliciesWhereUserIsValidatorThunk
} from "../../redux/policies/policiesSlice";
import {UiPolicy} from "../../services/IoloTypesForUi";
import DeletePolicyDialog from "../../components/policies/delete-policy-dialog";
import EditPolicyDialog from "../../components/policies/edit-policy-dialog";
import {Error} from "../../components/error/error";
import ViewPolicyDialog from "../../components/policies/view-policy-dialog";
import {selectSecretListState} from "../../redux/secrets/secretsSelectors";
import {loadSecretsThunk} from "../../redux/secrets/secretsSlice";
import {loadContactsThunk} from "../../redux/contacts/contactsSlice";
import {selectContactListState} from "../../redux/contacts/contactsSelectors";
import ViewSecretDialog from "../../components/secret/view-secret-dialog";
import {useTranslation} from "react-i18next";
import {PolicyListItem} from "./policyListItem";

export function Policies() {

    const dispatch = useAppDispatch();
    const policies = useSelector(selectPolicies);
    const beneficiaryPolicies = useSelector(selectBeneficiaryPolicies);
    const validatorPolicies = useSelector(selectValidatorPolicies);
    const policyListState = useSelector(selectPolicyListState);
    const policyListError = useSelector(selectPolicyError);
    const secretListState = useSelector(selectSecretListState);
    const contactListState = useSelector(selectContactListState);
    const {t} = useTranslation();

    const [filteredPolicies, setFilteredPolicies] = useState(policies)
    const [filteredBeneficiaryPolicies, setFilteredBeneficiaryPolicies] = useState(beneficiaryPolicies)
    const [filteredValidatorPolicies, setFilteredValidatorPolicies] = useState(validatorPolicies)

    useEffect(() => {
        setFilteredPolicies(policies)
    }, [policies]);

    useEffect(() => {
        setFilteredBeneficiaryPolicies(filteredBeneficiaryPolicies)
    }, [filteredBeneficiaryPolicies]);

    useEffect(() => {
        setFilteredValidatorPolicies(filteredValidatorPolicies)
    }, [filteredValidatorPolicies]);

    useEffect(() => {
        if (secretListState === 'init') {
            dispatch(loadSecretsThunk())
        }
        if (contactListState === 'init') {
            dispatch(loadContactsThunk())
        }
        dispatch(loadPoliciesThunk())
        dispatch(loadPoliciesWhereUserIsBeneficiaryThunk())
        dispatch(loadPoliciesWhereUserIsValidatorThunk())
    }, [])

    const filterPolicyList = (search: string) => {
        const searchString = search.toLowerCase();
        if (searchString.length === 0) {
            setFilteredPolicies(policies);
            setFilteredBeneficiaryPolicies(beneficiaryPolicies)
            setFilteredValidatorPolicies(validatorPolicies)
        } else {
            setFilteredPolicies(policies.filter((p: UiPolicy) => p.name.toLowerCase().indexOf(searchString) >= 0))
            setFilteredBeneficiaryPolicies(beneficiaryPolicies.filter((p: UiPolicy) => p.name.toLowerCase().indexOf(searchString) >= 0))
            setFilteredValidatorPolicies(validatorPolicies.filter((p: UiPolicy) => p.name.toLowerCase().indexOf(searchString) >= 0))
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
                        <>
                            <Typography variant="h2">{t('policies.list.owner')}</Typography>
                            <Box>
                                <List dense={false}>
                                    {filteredPolicies.flatMap(f => f ? [f] : []).map((policy: UiPolicy) =>
                                        <PolicyListItem policy={policy}/>
                                    )}
                                </List>
                            </Box>
                        </>
                    }
                    {!hasError() && filteredBeneficiaryPolicies &&
                        <>
                            <Typography variant="h2">{t('policies.list.beneficiary')}</Typography>
                            <Box>
                                <List dense={false}>
                                    {filteredBeneficiaryPolicies.flatMap(f => f ? [f] : []).map((policy: UiPolicy) =>
                                        <PolicyListItem policy={policy}/>
                                    )}
                                </List>
                            </Box>
                        </>
                    }
                    {!hasError() && filteredValidatorPolicies &&
                        <>
                            <Typography variant="h2">{t('policies.list.validator')}</Typography>
                            <Box>
                                <List dense={false}>
                                    {filteredValidatorPolicies.flatMap(f => f ? [f] : []).map((policy: UiPolicy) =>
                                        <PolicyListItem policy={policy}/>
                                    )}
                                </List>
                            </Box>
                        </>
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
