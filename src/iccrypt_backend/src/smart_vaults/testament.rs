use std::collections::{BTreeMap, HashSet};

use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

use crate::{common::uuid::UUID, utils::time};

use super::{secret::SecretID, user_vault::KeyBox};

pub type TestamentID = UUID;

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
}

/// The struct provided by the backend when calling "create_secret". It contains:
#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct CreateTestamentArgs {}

impl Testament {
    pub fn new(testator: Principal) -> Self {
        let now: u64 = time::get_current_time();
        let uuid = UUID::new();
        Self {
            id: uuid,
            name: None,
            date_created: now,
            date_modified: now,
            testator,
            heirs: HashSet::new(),
            secrets: HashSet::new(),
            key_box: BTreeMap::new(),
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

    pub fn heirs(&self) -> &HashSet<Principal> {
        &self.heirs
    }

    pub fn secrets(&self) -> &HashSet<SecretID> {
        &self.secrets
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

/// SecretDecryptionMaterial contains all the information required to
/// decrypt a secret:
/// 1) The aes gcm decryption key encrypted with the uservault's vetkd key
/// 2) The nonce/iv required to decrypt the decryption key
/// 3) The nonces requried to decrypt the different fields
#[derive(Debug, CandidType, Deserialize, Serialize, Clone, Default)]
pub struct TestamentDecryptionMaterial {
    // the "decryption key" (encrypted using the uservaults vetkd) required to decrypt username, password and notes
    pub encrypted_decryption_key: Vec<u8>,
    // the initialization vector (iv/nonce) to decrypt the encrypted_decryption_key
    pub iv: Vec<u8>,
    // the iv/nonce required to decrypt the encrypted username using the "decryption key"
    pub username_decryption_nonce: Option<Vec<u8>>,
    // the iv/nonce required to decrypt the encrypted password using the "decryption key"
    pub password_decryption_nonce: Option<Vec<u8>>,
    // the iv/nonce required to decrypt the encrypted notes using the "decryption key"
    pub notes_decryption_nonce: Option<Vec<u8>>,
}
