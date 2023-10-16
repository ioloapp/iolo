use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(
    Debug, CandidType, Deserialize, Serialize, Clone, PartialEq, PartialOrd, Ord, Eq, Hash,
)]
pub struct UUID(pub u128);

pub type SecretID = String;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, Copy, PartialEq, Eq)]
pub enum SecretCategory {
    Password,
    Note,
    Document,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
pub struct Secret {
    pub id: String,
    pub date_created: u64,
    pub date_modified: u64,
    pub category: Option<SecretCategory>,
    pub name: Option<String>,
    pub username: Option<Vec<u8>>,
    pub password: Option<Vec<u8>>,
    pub url: Option<String>,
    pub notes: Option<Vec<u8>>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct AddSecretArgsOld {
    pub secret: Secret,
    pub symmetric_crypto_material: SecretSymmetricCryptoMaterial,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct AddSecretArgs {
    pub id: String,
    pub category: Option<SecretCategory>,
    pub name: Option<String>,
    pub username: Option<Vec<u8>>,
    pub password: Option<Vec<u8>>,
    pub url: Option<String>,
    pub notes: Option<Vec<u8>>,
    // All the information required to decrypt the secret.
    // This material will be stored in the uservault's key box
    pub symmetric_crypto_material: SecretSymmetricCryptoMaterial,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct SecretSymmetricCryptoMaterial {
    pub encrypted_symmetric_key: Vec<u8>,
    pub iv: Vec<u8>, // the initialization vector
    pub username_decryption_nonce: Option<Vec<u8>>,
    pub password_decryption_nonce: Option<Vec<u8>>,
    pub notes_decryption_nonce: Option<Vec<u8>>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
pub struct SecretListEntry {
    pub id: SecretID,
    pub category: Option<SecretCategory>,
    pub name: Option<String>,
}
