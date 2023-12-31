use std::collections::{BTreeMap, HashSet};

use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use crate::smart_vaults::secret::SecretListEntry;

use crate::utils::{caller::get_caller, time};

use super::{secret::SecretID, user_vault::KeyBox};

pub type TestamentID = String;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct Testament {
    id: TestamentID,
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
    condition_status: bool,
    condition_arg: u64 // currently only for max difference to last_login_date, in seconds
}

/// The struct provided by the backend when calling "create_secret". It contains:
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct AddTestamentArgs {
    pub id: String,
    name: Option<String>,
    heirs: HashSet<Principal>,
    secrets: HashSet<SecretID>,
    key_box: KeyBox,
    condition_arg: u64
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
pub struct TestamentListEntry {
    pub id: TestamentID,
    pub name: Option<String>,
    pub testator: Principal,
    pub condition_status: bool
}

impl From<Testament> for TestamentListEntry {
    fn from(t: Testament) -> Self {
        TestamentListEntry {
            id: t.id().into(),
            name: t.name,
            testator: t.testator.clone(),
            condition_status: t.condition_status,
        }
    }
}


impl Testament {
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
            condition_arg: 0,
            condition_status: false
        }
    }

    pub fn id(&self) -> &TestamentID {
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

    pub fn condition_arg(&self) -> &u64{
        &self.condition_arg
    }

    pub fn condition_status(&self) -> &bool{
        &self.condition_status
    }

    pub fn set_condition_status(&mut self, status: bool) {
        self.condition_status = status;
        self.date_modified = time::get_current_time();
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

    // TODO: make proper CRUD functions
    pub fn key_box_mut(&mut self) -> &mut KeyBox {
        &mut self.key_box
    }

    pub fn key_box(&self) -> &KeyBox {
        &self.key_box
    }
}

impl From<AddTestamentArgs> for Testament {
    fn from(ata: AddTestamentArgs) -> Self {
        let mut new_testament = Testament::new(ata.id);
        new_testament.name = ata.name;
        new_testament.heirs = ata.heirs;
        new_testament.secrets = ata.secrets;
        new_testament.key_box = ata.key_box;
        new_testament.condition_arg = ata.condition_arg;
        new_testament
    }
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct TestamentResponse {
    id: TestamentID,
    name: Option<String>,
    date_created: u64,
    date_modified: u64,
    testator: Principal,
    heirs: HashSet<Principal>,
    secrets: HashSet<SecretListEntry>,
    key_box: KeyBox,
    condition_status: bool,
    condition_arg: u64 // currently only for max difference to last_login_date, in seconds
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
            condition_arg: 0,
            condition_status: false
        }
    }

    pub fn secrets(&mut self) -> &mut HashSet<SecretListEntry> {
        &mut self.secrets
    }
}

impl From<Testament> for TestamentResponse {
    fn from(t: Testament) -> Self {
        let mut new_testament = TestamentResponse::new(t.id);
        new_testament.name = t.name;
        new_testament.testator = t.testator;
        new_testament.heirs = t.heirs;
        new_testament.key_box = t.key_box;
        new_testament.condition_arg = t.condition_arg;
        new_testament.condition_status = t.condition_status;
        new_testament
    }
}