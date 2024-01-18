use std::collections::{BTreeMap, HashSet};

use candid::{CandidType, Principal};
use serde::Deserialize;

use crate::common::error::SmartVaultErr;
use crate::policies::conditions::{Condition, Validator};
use crate::policies::policy::{Policy, PolicyID};

#[derive(Debug, CandidType, Deserialize)]
pub struct PolicyRegistryForBeneficiaries {
    beneficiaries_to_policies: BTreeMap<Principal, HashSet<PolicyID>>,
    policy_to_owner: BTreeMap<PolicyID, Principal>,
}

impl PolicyRegistryForBeneficiaries {
    pub fn new() -> Self {
        Self {
            beneficiaries_to_policies: BTreeMap::new(),
            policy_to_owner: BTreeMap::new(),
        }
    }

    pub fn remove_policy_from_registry(&mut self, policy: &Policy) {
        for beneficiary in policy.beneficiaries() {
            if let Some(policy_ids) = self.beneficiaries_to_policies.get_mut(beneficiary) {
                policy_ids.remove(policy.id());
                if policy_ids.is_empty() {
                    self.beneficiaries_to_policies.remove(beneficiary);
                }
            }
        }
        self.policy_to_owner.remove(policy.id());
    }

    pub fn add_policy_to_registry(&mut self, policy: &Policy) {
        for beneficiary in policy.beneficiaries() {
            self.beneficiaries_to_policies
                .entry(beneficiary.clone())
                .or_insert_with(HashSet::new)
                .insert(policy.id().clone());
        }
        self.policy_to_owner
            .insert(policy.id().clone(), policy.owner().clone());
    }

    pub fn update_policy_in_registry(&mut self, policy_new: &Policy, policy_old: &Policy) {
        // Delete all existing entries for old policy
        for beneficiary in policy_old.beneficiaries() {
            if let Some(policy) = self.beneficiaries_to_policies.get_mut(beneficiary) {
                policy.remove(policy_old.id());
                if policy.is_empty() {
                    self.beneficiaries_to_policies.remove(beneficiary);
                }
            }
        }
        self.policy_to_owner.remove(policy_old.id());

        // Add new policy
        self.add_policy_to_registry(policy_new);
    }

    pub fn get_policy_id_as_beneficiary(
        &self,
        beneficiary: Principal,
        policy_id: PolicyID,
    ) -> Result<(PolicyID, Principal), SmartVaultErr> {
        // Check if the beneficiary exists in the map and contains the policy_id
        if let Some(policy_ids) = self.beneficiaries_to_policies.get(&beneficiary) {
            return if policy_ids.contains(&policy_id) {
                // If policy_id is found for the beneficiary, retrieve the associated owner
                if let Some(owner) = self.policy_to_owner.get(&policy_id) {
                    Ok((policy_id, owner.clone()))
                } else {
                    // Return an error if policy_id doesn't have a corresponding owner
                    Err(SmartVaultErr::PolicyDoesNotExist(policy_id)) // Replace with appropriate error variant
                }
            } else {
                // Return an error if beneficiary doesn't have the specified policy_id
                Err(SmartVaultErr::PolicyDoesNotExist(policy_id)) // Replace with appropriate error variant
            };
        }
        // Return an error if the beneficiary doesn't exist in the map
        Err(SmartVaultErr::PolicyDoesNotExist(policy_id))
    }

    pub fn get_policy_ids_as_beneficiary(
        &self,
        beneficiary: Principal,
    ) -> Vec<(PolicyID, Principal)> {
        let mut result = Vec::new();

        // Check if the beneficiary exists
        if let Some(beneficiary_ids) = self.beneficiaries_to_policies.get(&beneficiary) {
            // For each policy_id, get the corresponding owner
            for policy_id in beneficiary_ids {
                if let Some(owner) = self.policy_to_owner.get(policy_id) {
                    result.push((policy_id.clone(), owner.clone()));
                }
            }
        }
        result
    }

    pub fn get_owner_of_policy(&self, policy_id: PolicyID) -> Option<Principal> {
        self.policy_to_owner.get(&policy_id).copied()
    }
}

#[derive(Debug, CandidType, Deserialize)]
pub struct PolicyRegistryForValidators {
    validator_to_policies: BTreeMap<Principal, HashSet<PolicyID>>,
    policy_to_owner: BTreeMap<PolicyID, Principal>,
}

impl PolicyRegistryForValidators {
    pub fn new() -> Self {
        Self {
            validator_to_policies: BTreeMap::new(),
            policy_to_owner: BTreeMap::new(),
        }
    }

    pub fn get_policy_ids_as_validator(&self, validator: Principal) -> Vec<(PolicyID, Principal)> {
        let mut result = Vec::new();

        // Check if the validator exists
        if let Some(policy_ids) = self.validator_to_policies.get(&validator) {
            // For each policy_id, get the corresponding owner
            for policy_id in policy_ids {
                if let Some(owner) = self.policy_to_owner.get(policy_id) {
                    result.push((policy_id.clone(), *owner));
                }
            }
        }
        result
    }

    pub fn add_policy_to_registry(
        &mut self,
        validators: &Vec<Validator>,
        policy_id: &PolicyID,
        owner: &Principal,
    ) {
        for validator in validators {
            self.validator_to_policies
                .entry(validator.id.clone())
                .or_insert_with(HashSet::new)
                .insert(policy_id.clone());
        }
        self.policy_to_owner
            .insert(policy_id.clone(), owner.clone());
    }

    pub fn update_policy_in_registry(&mut self, policy_new: &Policy, policy_old: &Policy) {
        // Delete all existing entries for old policy
        for condition in policy_old.conditions().iter() {
            match condition {
                Condition::XOutOfYCondition(xoutofy) => {
                    for validator in xoutofy.validators.iter() {
                        if let Some(policies) = self.validator_to_policies.get_mut(&validator.id) {
                            policies.remove(policy_old.id());
                            if policies.is_empty() {
                                self.validator_to_policies.remove(&validator.id);
                            }
                        }
                    }
                    self.policy_to_owner.remove(policy_old.id());
                }
                _ => {}
            }
        }

        // Add new policy
        for condition in policy_new.conditions().iter() {
            match condition {
                Condition::XOutOfYCondition(xoutofy) => {
                    self.add_policy_to_registry(
                        &xoutofy.validators,
                        policy_new.id(),
                        policy_new.owner(),
                    );
                }
                _ => {}
            }
        }
    }
}
