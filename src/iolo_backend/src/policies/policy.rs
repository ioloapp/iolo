use candid::{CandidType, Decode, Encode};
use ic_stable_structures::storable::Bound;
use ic_stable_structures::Storable;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::collections::{BTreeMap, HashSet};
use std::hash::{Hash, Hasher};

use crate::policies::conditions::{Condition, UpdateCondition, Validator};
use crate::secrets::secret::SecretID;
use crate::secrets::secret::SecretListEntry;
use crate::users::user::{KeyBox, PrincipalID};
use crate::utils::{caller::get_caller, time};

pub type PolicyID = String;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct Policy {
    pub id: PolicyID,
    owner: PrincipalID,
    pub name: Option<String>,
    date_created: u64,
    pub date_modified: u64,
    pub beneficiaries: HashSet<PrincipalID>,
    pub secrets: HashSet<SecretID>,
    /// Contains all the keys required to decrypt the secrets:
    /// Every secret is encrypted by using dedicated key.
    /// This key is itself encrypted using the policy decryption key,
    /// which itself is derived by vetkd.
    pub key_box: KeyBox,
    pub conditions_status: bool,
    conditions_logical_operator: Option<LogicalOperator>,
    pub conditions: Vec<Condition>,
}

impl Hash for Policy {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.id.hash(state);
    }
}

impl Eq for Policy {}

impl PartialEq for Policy {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
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
pub struct CreatePolicyArgs {
    pub name: Option<String>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct UpdatePolicyArgs {
    pub id: PolicyID,
    pub name: Option<String>,
    pub beneficiaries: HashSet<PrincipalID>,
    pub secrets: HashSet<SecretID>,
    pub key_box: KeyBox,
    pub conditions_logical_operator: Option<LogicalOperator>,
    pub conditions: Vec<UpdateCondition>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
pub struct PolicyListEntry {
    pub id: PolicyID,
    pub name: Option<String>,
    pub owner: PrincipalID,
    pub condition_status: bool,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct PolicyForValidator {
    pub id: PolicyID,
    pub owner: PrincipalID,
    pub xooy_conditions: Vec<Condition>,
}

impl From<Policy> for PolicyListEntry {
    fn from(t: Policy) -> Self {
        PolicyListEntry {
            id: t.id().into(),
            name: t.name,
            owner: t.owner,
            condition_status: t.conditions_status,
        }
    }
}

impl Policy {
    pub fn new(id: String, owner: &PrincipalID) -> Self {
        let now: u64 = time::get_current_time();
        Self {
            id,
            name: None,
            date_created: now,
            date_modified: now,
            owner: owner.to_string(),
            beneficiaries: HashSet::new(),
            secrets: HashSet::new(),
            key_box: BTreeMap::new(),
            conditions_status: false,
            conditions_logical_operator: None,
            conditions: Vec::new(),
        }
    }

    pub fn from_create_policy_args(policy_id: &str, owner: &PrincipalID, apa: CreatePolicyArgs) -> Self {
        let mut new_policy = Policy::new(policy_id.to_string(), owner);
        new_policy.owner = owner.to_string();
        new_policy.name = apa.name;
        new_policy.beneficiaries = HashSet::new();
        new_policy.secrets = HashSet::new();
        new_policy.key_box = BTreeMap::new();
        new_policy.conditions = Vec::new();
        new_policy.conditions_logical_operator = None;
        new_policy.conditions_status = false;
        new_policy
    }

    pub fn from_update_policy_args(
        policy_id: &str,
        owner: &PrincipalID,
        condition_status: bool,
        date_created: u64,
        new_conditions: Vec<Condition>,
        upa: UpdatePolicyArgs,
    ) -> Self {




        let mut new_policy = Policy::new(policy_id.to_string(), owner);
        new_policy.owner = owner.to_string();
        new_policy.name = upa.name;
        new_policy.beneficiaries = upa.beneficiaries;
        new_policy.secrets = upa.secrets;
        new_policy.key_box = upa.key_box;
        new_policy.conditions = new_conditions;
        new_policy.conditions_logical_operator = upa.conditions_logical_operator;
        new_policy.conditions_status = condition_status;
        new_policy.date_created = date_created;
        new_policy
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

    pub fn owner(&self) -> &PrincipalID {
        &self.owner
    }

    pub fn name(&self) -> &Option<String> {
        &self.name
    }

    pub fn beneficiaries(&self) -> &HashSet<PrincipalID> {
        &self.beneficiaries
    }

    pub fn secrets(&self) -> &HashSet<SecretID> {
        &self.secrets
    }

    pub fn conditions(&self) -> &Vec<Condition> {
        &self.conditions
    }

    pub fn conditions_mut(&mut self) -> &mut Vec<Condition> {
        &mut self.conditions
    }

    pub fn conditions_status(&self) -> &bool {
        &self.conditions_status
    }

    pub fn conditions_logical_operator(&self) -> &Option<LogicalOperator> {
        &self.conditions_logical_operator
    }

    pub fn set_condition_status(&mut self, status: bool) {
        self.conditions_status = status;
    }
    /// Returns whether the value was newly inserted. That is:
    /// - If beneficiaries did not previously contain this beneficiary, true is returned.
    /// - If beneficiaries already contained this beneficiary, false is returned, and the set is not modified.
    ///   Original value is not replaced, and the value passed as argument is dropped.
    pub fn add_beneficiary(&mut self, beneficiary: PrincipalID) -> bool {
        self.beneficiaries.insert(beneficiary)
    }

    pub fn remove_beneficiary(&mut self, beneficiary: &PrincipalID) -> bool {
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
    pub fn find_validator_mut(&mut self, principal: &PrincipalID) -> Option<&mut Validator> {
        for condition in &mut self.conditions {
            if let Condition::XOutOfY(x_out_of_y) = condition {
                for validator in &mut x_out_of_y.validators {
                    if &validator.principal_id == principal {
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

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct PolicyWithSecretListEntries {
    id: PolicyID,
    name: Option<String>,
    date_created: u64,
    date_modified: u64,
    owner: PrincipalID,
    pub beneficiaries: HashSet<PrincipalID>,
    secrets: HashSet<SecretListEntry>,
    key_box: KeyBox,
    conditions_status: bool,
    conditions_logical_operator: Option<LogicalOperator>,
    pub conditions: Vec<Condition>,
}

impl PolicyWithSecretListEntries {
    pub fn new(id: String) -> Self {
        let now: u64 = time::get_current_time();
        Self {
            id,
            name: None,
            date_created: now,
            date_modified: now,
            owner: get_caller().to_string(),
            beneficiaries: HashSet::new(),
            secrets: HashSet::new(),
            key_box: BTreeMap::new(),
            conditions: Vec::new(),
            conditions_status: false,
            conditions_logical_operator: None,
        }
    }

    pub fn secrets(&mut self) -> &mut HashSet<SecretListEntry> {
        &mut self.secrets
    }
}

impl From<Policy> for PolicyWithSecretListEntries {
    fn from(t: Policy) -> Self {
        let mut new_policies = PolicyWithSecretListEntries::new(t.id);
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
