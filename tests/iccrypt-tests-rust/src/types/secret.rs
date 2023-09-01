use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
pub struct UUID(u128);
pub type SecretID = UUID;

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, Copy, PartialEq, Eq)]
pub enum SecretCategory {
    Password,
    Note,
    Document,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
pub struct Secret {
    pub id: UUID,
    date_created: u64,
    date_modified: u64,
    category: SecretCategory,
    name: String,
    pub username: Option<Vec<u8>>,
    pub password: Option<Vec<u8>>,
    url: Option<String>,
    pub notes: Option<Vec<u8>>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct CreateSecretArgs {
    pub category: SecretCategory,
    pub name: String,
    pub username: Option<Vec<u8>>,
    pub password: Option<Vec<u8>>,
    pub url: Option<String>,
    pub notes: Option<Vec<u8>>,
    pub decryption_material: SecretDecryptionMaterial,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct SecretDecryptionMaterial {
    pub encrypted_decryption_key: Vec<u8>,
    pub iv: Vec<u8>, // the initialization vector
    pub username_decryption_nonce: Option<Vec<u8>>,
    pub password_decryption_nonce: Option<Vec<u8>>,
    pub notes_decryption_nonce: Option<Vec<u8>>,
}
