use std::borrow::Cow;
use std::collections::HashSet;

use candid::{CandidType, Decode, Encode};
use ic_stable_structures::storable::Bound;
use ic_stable_structures::{StableBTreeMap, Storable};
use serde::{Deserialize, Serialize};

use crate::common::error::SmartVaultErr;
use crate::common::memory::{
    get_stable_btree_memory_for_policies_b2p, get_stable_btree_memory_for_policies_v2p, Memory,
};

use crate::policies::conditions::Validator;
use crate::policies::policy::{Policy, PolicyID};
use crate::users::user::PrincipalID;

use super::policies_interface_impl::get_policies_from_policy_store;
use super::policy::PolicyListEntry;

/** New: combining the two below */
#[derive(Serialize, Deserialize)]
pub struct PolicyRegistries {
    /// Maps a beneficiary (principal) to a set of policies.
    #[serde(skip, default = "init_stable_data_b2p")]
    pub beneficiary_to_policies: StableBTreeMap<PrincipalID, PolicyHashSetStorable, Memory>,

    /// Maps a principal to a set of policies the principal is a validator for.
    #[serde(skip, default = "init_stable_data_v2p")]
    pub validator_to_policies: StableBTreeMap<PrincipalID, PolicyHashSetStorable, Memory>,
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

fn init_stable_data_b2p() -> StableBTreeMap<PrincipalID, PolicyHashSetStorable, Memory> {
    StableBTreeMap::init(get_stable_btree_memory_for_policies_b2p())
}

fn init_stable_data_v2p() -> StableBTreeMap<PrincipalID, PolicyHashSetStorable, Memory> {
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
            match self.beneficiary_to_policies.get(beneficiary) {
                Some(mut sphs) => {
                    // entry for beneficiary already exists
                    sphs.0.insert(policy.id().clone());
                }
                None => {
                    // no entry for beneficiary yet
                    let mut hs: HashSet<PolicyID> = HashSet::new();
                    hs.insert(policy.id().clone());

                    self.beneficiary_to_policies
                        .insert(beneficiary.to_string(), PolicyHashSetStorable(hs));
                }
            };
        }
    }

    pub fn remove_policy_from_beneficiary(&mut self, policy: &Policy) {
        for beneficiary in policy.beneficiaries() {
            if let Some(mut policy_hash_set) = self.beneficiary_to_policies.get(beneficiary) {
                policy_hash_set.0.remove(policy.id());

                // re-insert the updated policy_hash_set
                self.beneficiary_to_policies
                    .insert(beneficiary.to_string(), policy_hash_set);
            }
        }
    }

    pub fn add_policy_to_validators(&mut self, validators: &Vec<Validator>, policy_id: &PolicyID) {
        for validator in validators {
            match self.validator_to_policies.get(&validator.principal_id) {
                Some(mut sphs) => {
                    // entry for validator already exists
                    sphs.0.insert(policy_id.clone());
                }
                None => {
                    // no entry for validator yet
                    let mut hs: HashSet<PolicyID> = HashSet::new();
                    hs.insert(policy_id.clone());

                    self.validator_to_policies.insert(
                        validator.principal_id.to_string(),
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
            if let Some(mut policy_hash_set) =
                self.validator_to_policies.get(&validator.principal_id)
            {
                policy_hash_set.0.remove(policy_id);

                // re-insert the policy_hash_set
                self.validator_to_policies
                    .insert(validator.principal_id.to_string(), policy_hash_set);
            }
        }
    }

    pub fn get_policy_ids_as_beneficiary(
        &self,
        beneficiary: &PrincipalID,
    ) -> Result<Vec<PolicyListEntry>, SmartVaultErr> {
        let policy_ids = match self.beneficiary_to_policies.get(beneficiary) {
            Some(sphs) => sphs.0.clone(),
            None => return Ok(vec![]),
        };

        // get the policies form the policy store
        let policies = get_policies_from_policy_store(policy_ids.into_iter().collect())?;
        Ok(policies.into_iter().map(PolicyListEntry::from).collect())
    }

    pub fn get_policy_ids_as_validator(
        &self,
        validator: &PrincipalID,
    ) -> Result<Vec<Policy>, SmartVaultErr> {
        let policy_ids = match self.validator_to_policies.get(validator) {
            Some(sphs) => sphs.0.clone(),
            None => return Ok(vec![]),
        };

        // get the policies form the policy store
        let policies = get_policies_from_policy_store(policy_ids.into_iter().collect())?;
        Ok(policies)
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
