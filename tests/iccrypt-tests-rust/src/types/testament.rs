use std::collections::{BTreeMap, HashSet};

use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

use super::secret::{SecretDecryptionMaterial, SecretID, UUID};

pub type TestamentID = UUID;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct Testament {
    id: TestamentID,
    date_created: u64,
    date_modified: u64,
    testator: Principal,
    heirs: HashSet<Principal>,
    secrets: HashSet<SecretID>,
    key_box: BTreeMap<SecretID, SecretDecryptionMaterial>,
}

/// The struct provided by the backend when calling "create_secret". It contains:
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct CreateTestamentArgs {
    pub name: String,
}
