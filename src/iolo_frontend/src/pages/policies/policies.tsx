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
import {UiPolicy, UiPolicyListEntry} from "../../services/IoloTypesForUi";
import DeletePolicyDialog from "../../components/policies/delete-policy-dialog";
import EditPolicyDialog from "../../components/policies/edit-policy-dialog";
import {Error} from "../../components/error/error";
import ViewPolicyDialog from "../../components/policies/view-policy-dialog";
import {selectSecretListState} from "../../redux/secrets/secretsSelectors";
import {loadSecretsThunk} from "../../redux/secrets/secretsSlice";
import {loadContactsThunk} from "../../redux/contacts/contactsSlice";
import {selectContactListState} from "../../redux/contacts/contactsSelectors";
import ViewVaultDialog from "../../components/vault/view-vault-dialog";
import {useTranslation} from "react-i18next";
import {PolicyListItem} from "./policyListItem";
import {ValidationListItem} from "./validationListItem";

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

    const [filteredPolicies, setFilteredPolicies] = useState(policies ? policies : [])
    const [filteredBeneficiaryPolicies, setFilteredBeneficiaryPolicies] = useState(beneficiaryPolicies ? beneficiaryPolicies : [])
    const [filteredValidatorPolicies, setFilteredValidatorPolicies] = useState(validatorPolicies ? validatorPolicies : [])
    const [listError, setListError] = useState(false);

    useEffect(() => {
        setListError(policyListState === 'failed')
        setFilteredPolicies(policies)
    }, [policies, policyListState]);

    useEffect(() => {
        setListError(policyListState === 'failed')
        setFilteredBeneficiaryPolicies(beneficiaryPolicies)
    }, [beneficiaryPolicies, policyListState]);

    useEffect(() => {
        setListError(policyListState === 'failed')
        setFilteredValidatorPolicies(validatorPolicies)
    }, [validatorPolicies, policyListState]);

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

    return (
        <PageLayout title={t('policies.title')} filterList={filterPolicyList}>
            <>
                <Box>
                    {listError &&
                        <Error error={policyListError}/>
                    }
                    {!listError &&
                        <>
                            <Typography variant="h2">{t('policies.list.owner')}</Typography>
                            <Box>
                                <List dense={false}>
                                    {filteredPolicies.map((policy: UiPolicyListEntry) =>
                                        <PolicyListItem policy={policy} key={policy.id}/>
                                    )}
                                </List>
                            </Box>
                            <Typography variant="h2">{t('policies.list.beneficiary')}</Typography>
                            <Box>
                                <List dense={false}>
                                    {filteredBeneficiaryPolicies.map((policy: UiPolicyListEntry) =>
                                        <PolicyListItem policy={policy} key={policy.id}/>
                                    )}
                                </List>
                            </Box>
                            <Typography variant="h2">{t('policies.list.validator')}</Typography>
                            <Box>
                                <List dense={false}>
                                    {filteredValidatorPolicies.map((policy: UiPolicy) =>
                                        policy.conditions?.map(condition =>
                                            <ValidationListItem owner={policy.owner} policyId={policy.id} condition={condition} key={condition.id}/>
                                        )
                                    )}
                                </List>
                            </Box>
                        </>
                    }
                </Box>
                <ViewVaultDialog/>
                <AddPolicyDialog/>
                <ViewPolicyDialog/>
                <EditPolicyDialog/>
                <DeletePolicyDialog/>
            </>
        </PageLayout>
    );
}
