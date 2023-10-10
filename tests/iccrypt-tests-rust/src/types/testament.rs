use std::collections::{BTreeMap, HashSet};

use candid::{CandidType, Principal};

use serde::{Deserialize, Serialize};

use super::secret::{SecretDecryptionMaterial, SecretID};

pub type TestamentID = String;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct Testament {
    pub id: TestamentID,
    pub name: Option<String>,
    pub date_created: u64,
    pub date_modified: u64,
    pub testator: Principal,
    pub heirs: HashSet<Principal>,
    // References to the secrets contained in this testament
    // Path to secret: testator -> testator uservault -> secret
    pub secrets: HashSet<SecretID>,
    /// Contains all the keys required to decrypt the secrets:
    /// Every secret is encrypted by using dedicated key.
    /// This key is itself encrypted using the Testament decryption key,
    /// which itself is derived by vetkd.
    pub key_box: BTreeMap<SecretID, SecretDecryptionMaterial>,
}

/// The struct provided by the backend when calling "create_secret". It contains:
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct AddTestamentArgs {
    pub id: String,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct TestamentKeyDerviationArgs {
    pub encryption_public_key: Vec<u8>,
    pub testament_id: String,
}
