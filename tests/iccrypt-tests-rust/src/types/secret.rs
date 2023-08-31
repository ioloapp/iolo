use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
pub struct UUID(u128);

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, Copy, PartialEq, Eq)]
pub enum SecretCategory {
    Password,
    Note,
    Document,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone, PartialEq)]
pub struct Secret {
    id: UUID,
    date_created: u64,
    date_modified: u64,
    category: SecretCategory,
    name: String,
    username: Option<String>,
    password: Option<String>,
    url: Option<String>,
    notes: Option<String>,
}

#[derive(Debug, CandidType, Deserialize, Serialize, Clone)]
pub struct CreateSecretArgs {
    pub category: SecretCategory,
    pub name: String,
    pub username: Option<String>,
    pub password: Option<String>,
    pub url: Option<String>,
    pub notes: Option<String>,
}
