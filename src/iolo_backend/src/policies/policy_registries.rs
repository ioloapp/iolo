use std::borrow::Cow;
use std::collections::{BTreeMap, HashSet};

use candid::{CandidType, Decode, Encode, Principal};
use ic_stable_structures::storable::Bound;
use ic_stable_structures::{StableBTreeMap, Storable};
use serde::{Deserialize, Serialize};

use crate::common::error::SmartVaultErr;
use crate::common::memory::{
    get_stable_btree_memory_for_policies_b2p, get_stable_btree_memory_for_policies_v2p, Memory,
};
use crate::common::principal_storable::PrincipalStorable;
use crate::policies::conditions::{Condition, Validator};
use crate::policies::policy::{Policy, PolicyID};
use crate::smart_vaults::smart_vault::POLICY_STORE;

use super::policy::PolicyListEntry;

/** New: combining the two below */
#[derive(Serialize, Deserialize)]
pub struct PolicyRegistries {
    /// Maps a beneficiary (principal) to a set of policies.
    #[serde(skip, default = "init_stable_data_b2p")]
    pub beneficiary_to_policies: StableBTreeMap<PrincipalStorable, PolicyHashSetStorable, Memory>,

    /// Maps a principal to a set of policies the principal is a validator for.
    #[serde(skip, default = "init_stable_data_v2p")]
    pub validator_to_policies: StableBTreeMap<PrincipalStorable, PolicyHashSetStorable, Memory>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
pub struct PolicyHashSetStorable(HashSet<PolicyID>);
impl Storable for PolicyHashSetStorable {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

fn init_stable_data_b2p() -> StableBTreeMap<PrincipalStorable, PolicyHashSetStorable, Memory> {
    StableBTreeMap::init(get_stable_btree_memory_for_policies_b2p())
}

fn init_stable_data_v2p() -> StableBTreeMap<PrincipalStorable, PolicyHashSetStorable, Memory> {
    StableBTreeMap::init(get_stable_btree_memory_for_policies_v2p())
}

impl Default for PolicyRegistries {
    fn default() -> Self {
        Self {
            beneficiary_to_policies: init_stable_data_b2p(),
            validator_to_policies: init_stable_data_v2p(),
        }
    }
}

impl PolicyRegistries {
    pub fn new() -> Self {
        Self {
            beneficiary_to_policies: init_stable_data_b2p(),
            validator_to_policies: init_stable_data_v2p(),
        }
    }

    pub fn add_policy_to_beneficiary(&mut self, policy: &Policy) {
        for beneficiary in policy.beneficiaries() {
            match self
                .beneficiary_to_policies
                .get(&PrincipalStorable::from(*beneficiary))
            {
                Some(mut sphs) => {
                    // entry for beneficiary already exists
                    sphs.0.insert(policy.id().clone());
                }
                None => {
                    // no entry for beneficiary yet
                    let mut hs: HashSet<PolicyID> = HashSet::new();
                    hs.insert(policy.id().clone());

                    self.beneficiary_to_policies.insert(
                        PrincipalStorable::from(*beneficiary),
                        PolicyHashSetStorable(hs),
                    );
                }
            };
        }
    }

    pub fn remove_policy_from_beneficiary(&mut self, policy: &Policy) {
        for beneficiary in policy.beneficiaries() {
            if let Some(mut policy_hash_set) = self
                .beneficiary_to_policies
                .get(&PrincipalStorable::from(*beneficiary))
            {
                policy_hash_set.0.remove(policy.id());

                // re-insert the updated policy_hash_set
                self.beneficiary_to_policies
                    .insert(PrincipalStorable::from(*beneficiary), policy_hash_set);
            }
        }
    }

    pub fn add_policy_to_validators(&mut self, validators: &Vec<Validator>, policy_id: &PolicyID) {
        for validator in validators {
            match self
                .validator_to_policies
                .get(&PrincipalStorable::from(validator.id))
            {
                Some(mut sphs) => {
                    // entry for validator already exists
                    sphs.0.insert(policy_id.clone());
                }
                None => {
                    // no entry for validator yet
                    let mut hs: HashSet<PolicyID> = HashSet::new();
                    hs.insert(policy_id.clone());

                    self.validator_to_policies.insert(
                        PrincipalStorable::from(validator.id),
                        PolicyHashSetStorable(hs),
                    );
                }
            };
        }
    }

    pub fn remove_policy_from_validators(
        &mut self,
        validator: &Vec<Validator>,
        policy_id: &PolicyID,
    ) {
        for validator in validator {
            if let Some(mut policy_hash_set) = self
                .validator_to_policies
                .get(&PrincipalStorable::from(validator.id))
            {
                policy_hash_set.0.remove(policy_id);

                // re-insert the policy_hash_set
                self.validator_to_policies
                    .insert(PrincipalStorable::from(validator.id), policy_hash_set);
            }
        }
    }

    pub fn get_policy_ids_as_beneficiary(
        &self,
        beneficiary: &Principal,
    ) -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
        // pub beneficiaries_to_policies: StableBTreeMap<PrincipalStorable, PolicyHashSetStorable, Memory>,
        let beneficiary_storable = PrincipalStorable::from(*beneficiary);

        let policy_ids = match self.beneficiary_to_policies.get(&beneficiary_storable) {
            Some(sphs) => sphs.0.clone(),
            None => return Ok(vec![]),
        };

        // get the policies form the policy store
        // TODO: use get_policies_from_policy_store helper
        POLICY_STORE.with(|ps| -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
            let policy_store = ps.borrow();
            let policy_list_entries: Vec<PolicyListEntry> = policy_ids
                .iter()
                .map(|policy_id| policy_store.get(policy_id).unwrap())
                .map(PolicyListEntry::from)
                .collect();
            Ok(policy_list_entries)
        })
    }

    pub fn get_policy_ids_as_validator(
        &self,
        validator: &Principal,
    ) -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
        // pub beneficiaries_to_policies: StableBTreeMap<PrincipalStorable, PolicyHashSetStorable, Memory>,
        let beneficiary_storable = PrincipalStorable::from(*validator);

        let policy_ids = match self.validator_to_policies.get(&beneficiary_storable) {
            Some(sphs) => sphs.0.clone(),
            None => return Ok(vec![]),
        };

        // get the policies form the policy store
        POLICY_STORE.with(|ps| -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
            let policy_store = ps.borrow();
            let policy_list_entries: Vec<PolicyListEntry> = policy_ids
                .iter()
                .map(|policy_id| policy_store.get(policy_id).unwrap())
                .map(PolicyListEntry::from)
                .collect();
            Ok(policy_list_entries)
        })
    }

    pub fn update_policy_to_beneficiary(
        &mut self,
        policy: &Policy,
    ) -> Result<Policy, SmartVaultErr> {
        // clean the index
        self.remove_policy_from_beneficiary(policy);

        // re-insert
        self.add_policy_to_beneficiary(policy);

        Ok(policy.clone())
    }

    pub fn update_policy_to_validators(
        &mut self,
        validators: &Vec<Validator>,
        policy_id: &PolicyID,
    ) {
        // clean the index
        self.remove_policy_from_validators(validators, policy_id);

        // re-insert
        self.add_policy_to_validators(validators, policy_id);
    }
}

/************************************************************************************
 * THE OLD WAY
 ************************************************************************************/

/**
 * PolicyRegistryForBeneficiaries is a registry that maps a beneficiary (principal)
 * to a set of policies.
 */
#[derive(Debug, CandidType, Deserialize)]
pub struct PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE {
    beneficiaries_to_policies: BTreeMap<Principal, HashSet<PolicyID>>,
    policy_to_owner: BTreeMap<PolicyID, Principal>,
}

/**
 * PolicyRegistryForValidators is a registry that maps a principal
 * to a set of policies the principal is a validator for.
 */
#[derive(Debug, CandidType, Deserialize)]
pub struct PolicyRegistryForValidators_DO_NOT_USE_ANYMORE {
    validator_to_policies: BTreeMap<Principal, HashSet<PolicyID>>,
    policy_to_owner: BTreeMap<PolicyID, Principal>,
}

impl PolicyRegistryForBeneficiaries_DO_NOT_USE_ANYMORE {
    pub fn new() -> Self {
        Self {
            beneficiaries_to_policies: BTreeMap::new(),
            policy_to_owner: BTreeMap::new(),
        }
    }

    pub fn add_policy_to_registry(&mut self, policy: &Policy) {
        for beneficiary in policy.beneficiaries() {
            self.beneficiaries_to_policies
                .entry(beneficiary.clone())
                .or_insert_with(HashSet::new)
                .insert(policy.id().clone());
        }
        self.policy_to_owner
            .insert(policy.id().clone(), *policy.owner());
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
                    Ok((policy_id, *owner))
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
                    result.push((policy_id.clone(), *owner));
                }
            }
        }
        result
    }

    pub fn get_owner_of_policy(&self, policy_id: PolicyID) -> Option<Principal> {
        self.policy_to_owner.get(&policy_id).copied()
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
}

impl PolicyRegistryForValidators_DO_NOT_USE_ANYMORE {
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
                .entry(validator.id)
                .or_insert_with(HashSet::new)
                .insert(policy_id.clone());
        }
        self.policy_to_owner.insert(policy_id.clone(), *owner);
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
