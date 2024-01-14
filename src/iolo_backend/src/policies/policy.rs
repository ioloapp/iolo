use std::collections::{BTreeMap, HashSet};

use crate::policies::conditions::{Condition, Validator};
use crate::secrets::secret::SecretListEntry;
use crate::user_vaults::user_vault::KeyBox;
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

use crate::utils::{caller::get_caller, time};

use crate::secrets::secret::SecretID;

pub type PolicyID = String;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct Policy {
    id: PolicyID,
    name: Option<String>,
    date_created: u64,
    date_modified: u64,
    testator: Principal,
    heirs: HashSet<Principal>,
    // References to the secrets contained in this testament
    // Path to secret: testator -> testator uservault -> secret
    secrets: HashSet<SecretID>,
    /// Contains all the keys required to decrypt the secrets:
    /// Every secret is encrypted by using dedicated key.
    /// This key is itself encrypted using the Testament decryption key,
    /// which itself is derived by vetkd.
    key_box: KeyBox,
    conditions_status: bool,
    conditions_logical_operator: LogicalOperator,
    conditions: Vec<Condition>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub enum LogicalOperator {
    And,
    Or,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct AddTestamentArgs {
    pub id: String,
    name: Option<String>,
    heirs: HashSet<Principal>,
    secrets: HashSet<SecretID>,
    key_box: KeyBox,
    condition_logical_operator: LogicalOperator,
    conditions: Vec<Condition>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
pub struct TestamentListEntry {
    pub id: PolicyID,
    pub name: Option<String>,
    pub testator: Principal,
    pub condition_status: bool,
}

impl From<Policy> for TestamentListEntry {
    fn from(t: Policy) -> Self {
        TestamentListEntry {
            id: t.id().into(),
            name: t.name,
            testator: t.testator.clone(),
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
            testator: get_caller(),
            heirs: HashSet::new(),
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

    pub fn testator(&self) -> &Principal {
        &self.testator
    }

    pub fn name(&self) -> &Option<String> {
        &self.name
    }

    pub fn heirs(&self) -> &HashSet<Principal> {
        &self.heirs
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
    /// - If heirs did not previously contain this heir, true is returned.
    /// - If heirs already contained this heir, false is returned, and the set is not modified.
    ///   Original value is not replaced, and the value passed as argument is dropped.
    pub fn add_heir(&mut self, heir: Principal) -> bool {
        self.heirs.insert(heir)
    }

    pub fn remove_heir(&mut self, heir: &Principal) -> bool {
        self.heirs.remove(heir)
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

impl From<AddTestamentArgs> for Policy {
    fn from(ata: AddTestamentArgs) -> Self {
        let mut new_testament = Policy::new(ata.id);
        new_testament.name = ata.name;
        new_testament.heirs = ata.heirs;
        new_testament.secrets = ata.secrets;
        new_testament.key_box = ata.key_box;
        new_testament.conditions = ata.conditions;
        new_testament.conditions_logical_operator = ata.condition_logical_operator;
        new_testament.conditions_status = false;
        new_testament
    }
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct TestamentResponse {
    id: PolicyID,
    name: Option<String>,
    date_created: u64,
    date_modified: u64,
    testator: Principal,
    heirs: HashSet<Principal>,
    secrets: HashSet<SecretListEntry>,
    key_box: KeyBox,
    conditions_status: bool,
    conditions_logical_operator: LogicalOperator,
    conditions: Vec<Condition>,
}

impl TestamentResponse {
    pub fn new(id: String) -> Self {
        let now: u64 = time::get_current_time();
        Self {
            id,
            name: None,
            date_created: now,
            date_modified: now,
            testator: get_caller(),
            heirs: HashSet::new(),
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

impl From<Policy> for TestamentResponse {
    fn from(t: Policy) -> Self {
        let mut new_testament = TestamentResponse::new(t.id);
        new_testament.name = t.name;
        new_testament.testator = t.testator;
        new_testament.heirs = t.heirs;
        new_testament.key_box = t.key_box;
        new_testament.conditions = t.conditions;
        new_testament.conditions_logical_operator = t.conditions_logical_operator;
        new_testament.conditions_status = t.conditions_status;
        new_testament
    }
}
