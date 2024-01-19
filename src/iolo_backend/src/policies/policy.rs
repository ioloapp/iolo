use std::borrow::Cow;
use std::collections::{BTreeMap, HashSet};

use candid::{CandidType, Decode, Encode, Principal};
use ic_stable_structures::storable::Bound;
use ic_stable_structures::Storable;
use serde::{Deserialize, Serialize};

use crate::policies::conditions::{Condition, Validator};
use crate::secrets::secret::SecretID;
use crate::secrets::secret::SecretListEntry;
use crate::user_vaults::user_vault::KeyBox;
use crate::utils::{caller::get_caller, time};

pub type PolicyID = String;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct Policy {
    id: PolicyID,
    name: Option<String>,
    date_created: u64,
    date_modified: u64,
    owner: Principal,
    beneficiaries: HashSet<Principal>,
    // References to the secrets contained in this policy
    // Path to secret: owner -> owner uservault -> secret
    secrets: HashSet<SecretID>,
    /// Contains all the keys required to decrypt the secrets:
    /// Every secret is encrypted by using dedicated key.
    /// This key is itself encrypted using the policy decryption key,
    /// which itself is derived by vetkd.
    key_box: KeyBox,
    conditions_status: bool,
    conditions_logical_operator: LogicalOperator,
    conditions: Vec<Condition>,
}

impl Storable for Policy {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub enum LogicalOperator {
    And,
    Or,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct AddPolicyArgs {
    pub id: String,
    name: Option<String>,
    beneficiaries: HashSet<Principal>,
    secrets: HashSet<SecretID>,
    key_box: KeyBox,
    condition_logical_operator: LogicalOperator,
    conditions: Vec<Condition>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
pub struct PolicyListEntry {
    pub id: PolicyID,
    pub name: Option<String>,
    pub owner: Principal,
    pub condition_status: bool,
}

impl From<Policy> for PolicyListEntry {
    fn from(t: Policy) -> Self {
        PolicyListEntry {
            id: t.id().into(),
            name: t.name,
            owner: t.owner.clone(),
            condition_status: t.conditions_status,
        }
    }
}

impl Policy {
    pub fn new(id: String) -> Self {
        let now: u64 = time::get_current_time();
        Self {
            id,
            name: None,
            date_created: now,
            date_modified: now,
            owner: get_caller(),
            beneficiaries: HashSet::new(),
            secrets: HashSet::new(),
            key_box: BTreeMap::new(),
            conditions_status: false,
            conditions_logical_operator: LogicalOperator::And,
            conditions: Vec::new(),
        }
    }

    pub fn id(&self) -> &PolicyID {
        &self.id
    }

    pub fn date_created(&self) -> &u64 {
        &self.date_created
    }

    pub fn date_modified(&self) -> &u64 {
        &self.date_modified
    }

    pub fn owner(&self) -> &Principal {
        &self.owner
    }

    pub fn name(&self) -> &Option<String> {
        &self.name
    }

    pub fn beneficiaries(&self) -> &HashSet<Principal> {
        &self.beneficiaries
    }

    pub fn secrets(&self) -> &HashSet<SecretID> {
        &self.secrets
    }

    pub fn conditions(&self) -> &Vec<Condition> {
        &self.conditions
    }

    pub fn conditions_status(&self) -> &bool {
        &self.conditions_status
    }

    pub fn conditions_logical_operator(&self) -> &LogicalOperator {
        &self.conditions_logical_operator
    }

    pub fn set_condition_status(&mut self, status: bool) {
        self.conditions_status = status;
    }
    /// Returns whether the value was newly inserted. That is:
    /// - If beneficiaries did not previously contain this beneficiary, true is returned.
    /// - If beneficiaries already contained this beneficiary, false is returned, and the set is not modified.
    ///   Original value is not replaced, and the value passed as argument is dropped.
    pub fn add_beneficiary(&mut self, beneficiary: Principal) -> bool {
        self.beneficiaries.insert(beneficiary)
    }

    pub fn remove_beneficiary(&mut self, beneficiary: &Principal) -> bool {
        self.beneficiaries.remove(beneficiary)
    }

    pub fn add_secret(&mut self, secret: SecretID) -> bool {
        self.secrets.insert(secret)
    }

    pub fn remove_secret(&mut self, secret: &SecretID) -> bool {
        self.secrets.remove(secret)
    }

    pub fn set_conditions_status(&mut self, status: bool) {
        self.conditions_status = status;
    }

    // TODO: make proper CRUD functions
    pub fn key_box_mut(&mut self) -> &mut KeyBox {
        &mut self.key_box
    }

    pub fn key_box(&self) -> &KeyBox {
        &self.key_box
    }

    // Function to find a mutable reference to a validator if the given principal is one of them
    pub fn find_validator_mut(&mut self, principal: &Principal) -> Option<&mut Validator> {
        for condition in &mut self.conditions {
            if let Condition::XOutOfYCondition(x_out_of_y) = condition {
                for validator in &mut x_out_of_y.validators {
                    if &validator.id == principal {
                        // Return a mutable reference to the confirmer
                        return Some(validator);
                    }
                }
            }
        }
        // If no matching confirmer is found, return None
        None
    }
}

impl From<AddPolicyArgs> for Policy {
    fn from(ata: AddPolicyArgs) -> Self {
        let mut new_policy = Policy::new(ata.id);
        new_policy.name = ata.name;
        new_policy.beneficiaries = ata.beneficiaries;
        new_policy.secrets = ata.secrets;
        new_policy.key_box = ata.key_box;
        new_policy.conditions = ata.conditions;
        new_policy.conditions_logical_operator = ata.condition_logical_operator;
        new_policy.conditions_status = false;
        new_policy
    }
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct PolicyResponse {
    id: PolicyID,
    name: Option<String>,
    date_created: u64,
    date_modified: u64,
    owner: Principal,
    beneficiaries: HashSet<Principal>,
    secrets: HashSet<SecretListEntry>,
    key_box: KeyBox,
    conditions_status: bool,
    conditions_logical_operator: LogicalOperator,
    conditions: Vec<Condition>,
}

impl PolicyResponse {
    pub fn new(id: String) -> Self {
        let now: u64 = time::get_current_time();
        Self {
            id,
            name: None,
            date_created: now,
            date_modified: now,
            owner: get_caller(),
            beneficiaries: HashSet::new(),
            secrets: HashSet::new(),
            key_box: BTreeMap::new(),
            conditions: Vec::new(),
            conditions_status: false,
            conditions_logical_operator: LogicalOperator::And,
        }
    }

    pub fn secrets(&mut self) -> &mut HashSet<SecretListEntry> {
        &mut self.secrets
    }
}

impl From<Policy> for PolicyResponse {
    fn from(t: Policy) -> Self {
        let mut new_policies = PolicyResponse::new(t.id);
        new_policies.name = t.name;
        new_policies.owner = t.owner;
        new_policies.beneficiaries = t.beneficiaries;
        new_policies.key_box = t.key_box;
        new_policies.conditions = t.conditions;
        new_policies.conditions_logical_operator = t.conditions_logical_operator;
        new_policies.conditions_status = t.conditions_status;
        new_policies
    }
}
